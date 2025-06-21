import { cn } from "@/lib/utils";

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("flex flex-col gap-8 grow px-4 py-16", className)}>{children}</div>;
}
