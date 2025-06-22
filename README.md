# SplitBuy - Collective Buying, Simplified

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

SplitBuy is a full-stack web application designed to help people team up and take advantage of bulk-purchase discounts. It streamlines the entire group buying process, from creating a listing to secure payments and post-purchase reviews.

---

## About The Project

In a world of rising costs, everyone loves a good deal. SplitBuy was built to bridge the gap between individual shoppers and the significant discounts offered for bulk purchases. It's a community-driven marketplace where users can initiate, join, and manage group buys in a simple, transparent, and secure environment.

### Key Features

*   **URL-Based Listing Creation:** Automatically scrape product details (name, price, image) from any e-commerce URL to create a new group buy listing.
*   **Group Management:** Organizers can approve or deny requests from users who want to join their group buy.
*   **Secure Payment Flow:** A multi-step process ensures participants pay before the organizer makes the purchase.
    *   Participants pay directly through the platform (simulated).
    *   The organizer uploads proof of purchase for verification.
    *   Participants approve the proof to complete the transaction.
*   **Real-Time Chat:** Every group buy includes a dedicated chat room for participants to communicate and coordinate.
*   **User Profiles & Reviews:** After a successful purchase, participants can leave a 5-star rating and a review for the organizer, building a system of trust and accountability.
*   **Address Management & Geocoding:** Users can save residential and pickup addresses. We use the Mapbox API to anonymize coordinates, protecting user privacy while facilitating local pickups.

---

## Built With

This project leverages a modern, full-stack tech stack for a responsive and robust user experience.

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Firebase Authentication)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
*   **Form Management:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
*   **UI/UX:** [Lucide React](https://lucide.dev/) for icons, [Sonner](https://sonner.emilkowal.ski/) for toasts.
*   **Web Scraping:** [Groq](https://groq.com/) for AI-powered content extraction.
*   **APIs:** [Mapbox API](https://www.mapbox.com/) for geocoding

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm or pnpm
*   A Firebase project with Firestore and Authentication enabled.
*   A Mapbox account to obtain an access token.
*   A Groq account

### Installation

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/your-username/splitbuy.git
    cd splitbuy
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the root of your project and add the following, replacing the placeholder values with your own credentials.

    ```env
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_MAPBOX_TOKEN=...
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
    NEXT_PRIVATE_GROQ_TOKEN=...
    IREBASE_SERVICE_ACCOUNT_KEY=...
    ```

### Usage

Run the development server:

```sh
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---
