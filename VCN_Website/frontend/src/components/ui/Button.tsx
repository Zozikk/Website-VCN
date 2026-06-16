import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md";
};

const variantClassMap: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-vcn-red text-white hover:bg-vcn-red-dark border border-transparent",
  danger: "bg-white text-vcn-red border border-vcn-red hover:bg-red-50",
  ghost: "bg-white text-vcn-heading border border-vcn-border hover:bg-gray-50",
};

const sizeClassMap: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${variantClassMap[variant]} ${sizeClassMap[size]} ${className}`}
    />
  );
}
