import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Badge = ({ className = "", children, ...props }: BadgeProps) => {
  return (
    <div
      className={`inline-flex items-center rounded-full text-xs font-semibold ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
