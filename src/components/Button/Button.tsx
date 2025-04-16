import React, { type ComponentProps } from "react";
import "./button.css";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "small",
      children,
      className = "",
      style = {},
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`button ${variant} ${size} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
