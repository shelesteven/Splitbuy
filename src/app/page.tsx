import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function Home() {
    return (
        <section className="min-h-[calc(100vh)] flex items-center justify-center bg-gradient-to-br from-indigo-200 to-white dark:from-indigo-950/50 dark:to-gray-950 px-6 py-16 overflow-hidden">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-12 z-10">
                <div className="text-left max-w-xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-800 dark:text-indigo-400 leading-tight mb-6">
                        Group up. <br /> Save big.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 mb-8">Discover smarter shopping. Create or join a group buy to save money on bulk items and shipping.</p>
                </div>

                <Card className="w-full max-w-sm bg-background/80 p-8 shadow-xl">
                    <form className="flex flex-col gap-4">
                        <Input type="email" placeholder="you@example.com" />
                        <Button type="submit" className="w-full">
                            Sign Up Now
                        </Button>
                        <div className="text-sm text-center text-gray-500">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-indigo-600 hover:underline">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </section>
    );
}
