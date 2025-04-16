import { type ReactNode } from "react";
import {
  Info,
  Lightbulb,
  BookOpenText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  KeyboardMusic,
  ClipboardList,
} from "lucide-react";
import "./callout.css";

// Icon and color mapping
const styles = {
  info: {
    class: "info",
    icon: Info,
    title: "Information",
  },
  tip: {
    class: "tip",
    icon: Lightbulb,
    title: "Tip",
  },
  definition: {
    class: "definition",
    icon: BookOpenText,
    title: "Definition",
  },
  warning: {
    class: "warning",
    icon: AlertTriangle,
    title: "Warning",
  },
  exercise: {
    class: "exercise",
    icon: KeyboardMusic,
    title: "Exercise",
  },
  success: {
    class: "success",
    icon: CheckCircle,
    title: "Success",
  },
  error: {
    class: "error",
    icon: XCircle,
    title: "Error",
  },
  instructions: {
    class: "instructions",
    icon: ClipboardList,
    title: "Instructions",
  },
};

function Callout({
  type,
  children,
  title,
}: {
  type: keyof typeof styles;
  children: ReactNode;
  title?: string;
}) {
  const currentStyle = styles[type];
  const Icon = currentStyle.icon;
  const displayTitle = title || currentStyle.title;

  return (
    <div className={`callout ${currentStyle.class}`}>
      <div className="callout-content">
        <span className="callout-icon">
          <span className="sr-only">{type}</span>
          <Icon size={20} />
        </span>
        <div className="callout-text-container">
          <h4 className="callout-title">{displayTitle}</h4>
          <div className="callout-text">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Callout;
