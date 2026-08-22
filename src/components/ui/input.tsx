import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        suppressHydrationWarning
        className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
