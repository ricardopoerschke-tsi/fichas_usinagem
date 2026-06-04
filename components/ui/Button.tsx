import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  children,
  className = "",
  variant = "default",
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 font-semibold shadow-sm ${
        variant === "outline"
          ? "border border-slate-300 bg-white text-slate-700"
          : "bg-slate-900 text-white"
      } ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {children}
    </button>
  );
}