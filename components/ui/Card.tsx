import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({
  children,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div onClick={onClick} className={`bg-white ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: CardProps) {
  return <div className={className}>{children}</div>;
}