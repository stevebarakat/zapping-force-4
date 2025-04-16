import React from "react";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: React.ElementType;
}

/**
 * VisuallyHidden component renders content that is hidden visually
 * but still accessible to screen readers.
 *
 * @param {React.ReactNode} children - The content to be hidden visually
 * @param {React.ElementType} as - The HTML element to render (default: span)
 */
const VisuallyHidden = ({
  children,
  as: Component = "span",
}: VisuallyHiddenProps) => {
  return (
    <Component
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: "1px",
        whiteSpace: "nowrap",
        wordWrap: "normal",
      }}
    >
      {children}
    </Component>
  );
};

export default VisuallyHidden;
