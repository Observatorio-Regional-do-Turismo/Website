import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function FilterBar({ children, className, containerClassName }: FilterBarProps) {
  return (
    <div
      className={cn(
        "no-export print:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-16 z-30",
        className,
      )}
    >
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5", containerClassName)}>
        {children}
      </div>
    </div>
  );
}
