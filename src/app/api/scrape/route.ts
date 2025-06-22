import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";
import tempStore from "@/lib/temp-store";
import crypto from "crypto";

const groq = new Groq({
  apiKey: process.env.NEXT_PRIVATE_GROQ_TOKEN,
});

async function getPageContentWithAxios(url: string): Promise<string | null> {
  try {
    const { data: htmlContent } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    return htmlContent;
  } catch (error) {
    console.error("Axios fetch failed:", error);
    return null;
  }
}

async function getPageContentWithPuppeteer(
  url: string,
): Promise<string | null> {
  let browser;
  try {
    console.log("Using Puppeteer for full browser rendering...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // Increase timeout to 60 seconds
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    return await page.content();
  } catch (error) {
    console.error("Error fetching page content with Puppeteer:", error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function preprocessHtml(htmlContent: string | undefined): {
  textContent: string;
  imageUrls: string[];
} {
  if (!htmlContent) return { textContent: "", imageUrls: [] };

  try {
    const $ = cheerio.load(htmlContent);
    const imageUrls = new Set<string>();

    // Get high-quality images from meta tags first
    $('meta[property="og:image"]')
      .attr("content")
      ?.split(",")
      .forEach((url) => imageUrls.add(url.trim()));
    $('meta[property="twitter:image"]')
      .attr("content")
      ?.split(",")
      .forEach((url) => imageUrls.add(url.trim()));

    $("script, style, iframe, nav, footer, header, aside").remove();

    const mainContent =
      $("main, article, .product, #product-details").length > 0
        ? $("main, article, .product, #product-details")
        : $("body");

    // Get other images from the main content area
    mainContent.find("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:")) {
        imageUrls.add(src);
      }
    });

    const textContent = mainContent.html() || "";

    const cleanedText = textContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 15000);

    return { textContent: cleanedText, imageUrls: Array.from(imageUrls) };
  } catch (error) {
    console.error("Error preprocessing HTML:", error);
    return { textContent: htmlContent.substring(0, 10000), imageUrls: [] };
  }
}

async function callGroqApi(
  content: string,
  imageUrls: string[],
  url: string,
) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
You are an expert e-commerce assistant. Your task is to analyze the entire webpage content provided, including headers and promotional banners, to find products with discounts suitable for group buys.

A "discount" can be a standard price reduction (e.g., "was $10, now $8") OR a site-wide or category-wide multi-buy offer (e.g., "2 for $15", "Buy One Get One 50% off") that could apply to the product.

1.  **Validation**: First, identify the main product on the page. Then, look *anywhere* on the page for a discount that could apply to it. If you find a product and an applicable discount, it's valid. If not, respond with ONLY the following JSON:
    {"error": "This page does not appear to be a product page with a group-buy-friendly discount."}

2.  **Extraction**: If it's a valid page, extract the following information and respond with ONLY a valid JSON object. Do not add any commentary.
    {
      "name": "The full product name.",
      "category": "The most relevant product category.",
      "image": "From the list of possible image URLs provided, select the one that is the best and most representative main product image. If no suitable URL is found in the list, this value MUST be null.",
      "description": "A concise and appealing description of the product. If not available, use null.",
      "discountDescription": "A clear description of the discount offer (e.g., '2 for $15'). If not available, use null.",
      "pricePerUnit": "The original price for a single item, as a number. If not available, use null.",
      "discountedPrice": "The effective price PER ITEM with the discount applied, as a number. For a '2 for $15' offer on a $10 item, this would be 7.50. If not available, use null.",
      "minPeople": "The minimum number of items required to get the discount. For '2 for $15', this is 2. If it's not clear, default to 2.",
      "maxPeople": "A recommended reasonable maximum number of people for a group buy (e.g., 20). If it's not clear, default to 20."
    }
`,
      },
      {
        role: "user",
        content: `Here is the processed text content from ${url}:\n\n${content}\n\nHere is a list of potential image URLs found on the page. Please choose the best one:\n${imageUrls.join(
          "\n",
        )}`,
      },
    ],
    model: "deepseek-r1-distill-llama-70b",
    temperature: 0,
  });

  const result = chatCompletion.choices[0].message.content;
  if (!result) {
    throw new Error("Failed to get a response from Groq");
  }
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Groq did not return valid JSON");
  }
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // 1. Fast attempt with Axios
    console.log("Attempting fast fetch with axios...");
    let htmlContent = await getPageContentWithAxios(url);
    if (htmlContent) {
      const { textContent, imageUrls } = preprocessHtml(htmlContent);

      if (textContent) {
        const initialResult = await callGroqApi(textContent, imageUrls, url);
        // 2. If the fast attempt succeeds, we're done.
        if (!initialResult.error) {
          console.log("Success with fast fetch!");
          const token = crypto.randomUUID();
          tempStore.set(token, initialResult);
          return NextResponse.json({ ...initialResult, token });
        }
        console.log(
          "Initial attempt failed to find a deal, escalating to Puppeteer...",
        );
      }
    }

    // 3. If the fast attempt fails or provides no content, use Puppeteer.
    htmlContent = await getPageContentWithPuppeteer(url);
    if (!htmlContent) {
      return NextResponse.json(
        { error: "Failed to fetch page content with any method." },
        { status: 500 },
      );
    }
    const { textContent, imageUrls } = preprocessHtml(htmlContent);
    const finalResult = await callGroqApi(textContent, imageUrls, url);

    // 4. Return the result of the full browser attempt.
    if (!finalResult.error) {
      const token = crypto.randomUUID();
      tempStore.set(token, finalResult);
      return NextResponse.json({ ...finalResult, token });
    }

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Error in scraping process:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during scraping." },
      { status: 500 },
    );
  }
}