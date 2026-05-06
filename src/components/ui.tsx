import { ReactNode } from "react";
import { cn } from "../lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-surface-container-lowest text-on-surface shadow-soft border border-surface-container", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-xl font-bold leading-none tracking-tight text-on-surface", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("text-sm text-on-surface-variant", className)}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function Button({ className, variant = "primary", size = "default", ...props }: any) {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-container hover:shadow-soft",
    secondary: "bg-surface text-primary border border-surface-container-high hover:bg-surface-container-low",
    outline: "border border-primary/20 bg-surface text-primary hover:bg-primary/5",
    ghost: "hover:bg-primary/10 text-primary",
    destructive: "bg-error text-on-error hover:bg-error/90",
  };
  
  const sizes = {
    default: "h-12 px-6 py-2",
    sm: "h-10 px-4 text-sm",
    lg: "h-14 px-8 text-lg",
    icon: "h-12 w-12",
  };

  return (
    <button className={cn(base, variants[variant as keyof typeof variants], sizes[size as keyof typeof sizes], className)} {...props} />
  );
}

export function Input({ className, ...props }: any) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-4 py-2 text-base text-on-surface file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-outline focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
