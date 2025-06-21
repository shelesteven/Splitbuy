import { cn } from "@/lib/utils";

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("container flex grow px-4 py-16", className)}>{children}</div>;
}
