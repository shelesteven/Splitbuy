import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-6 py-16 overflow-hidden">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-12 z-10">
        {/* Left: Hero Text */}
        <div className="text-left max-w-xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-700 leading-tight mb-6">
            Group Up. <br /> Save Big.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Discover smarter shopping. Create or join a group buy to save money
            on bulk items and shipping.
          </p>
        </div>

        {/* Right: Signup Card */}
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-xl border">
          <form className="flex flex-col gap-4">
            <Input type="email" placeholder="you@example.com" />
            <Button type="submit" className="w-full text-lg">
              Sign Up Now
            </Button>
            <div className="text-sm text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/signin" className="text-indigo-600 hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Wave SVG */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[120px]"
        viewBox="0 0 1440 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          fill="#EEF2FF"
          d="M0,128L60,138.7C120,149,240,171,360,165.3C480,160,600,128,720,133.3C840,139,960,181,1080,202.7C1200,224,1320,224,1380,224L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>
    </section>
  );
}
