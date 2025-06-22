import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900",
        className,
      )}
      {...props}
    />
  );
} 