import React, { type ComponentProps } from "react";
import Button from "./Button";
import "./button.css";

interface IconButtonProps
  extends Omit<ComponentProps<typeof Button>, "children"> {
  icon: React.ReactNode;
  "aria-label": string; // Required for accessibility
  children: React.ReactNode;
}

function IconButton({
  icon,
  className = "",
  size = "medium",
  ...props
}: IconButtonProps) {
  return (
    <Button className={`icon-button ${className}`} size={size} {...props}>
      <span className="button-icon">{icon}</span>
      <span className="button-text">{props.children}</span>
      <span className="sr-only">{props["aria-label"]}</span>
    </Button>
  );
}

export default IconButton;
