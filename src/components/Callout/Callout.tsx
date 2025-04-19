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
  milestone: {
    class: "milestone",
    icon: CheckCircle,
    title: "Milestone",
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
  interactive: {
    class: "instructions",
    icon: ClipboardList,
    title: "Interactive",
  },
  note: {
    class: "info",
    icon: Info,
    title: "Note",
  },
  term: {
    class: "definition",
    icon: BookOpenText,
    title: "Term",
  },
  practice: {
    class: "tip",
    icon: Lightbulb,
    title: "Practice",
  },
  caution: {
    class: "warning",
    icon: AlertTriangle,
    title: "Caution",
  },
  activity: {
    class: "exercise",
    icon: KeyboardMusic,
    title: "Activity",
  },
  mistake: {
    class: "error",
    icon: XCircle,
    title: "Mistake",
  },
  success: {
    class: "success",
    icon: CheckCircle,
    title: "Success",
  },
} as const;

type CalloutType = keyof typeof styles;

function Callout({
  type,
  children,
  title,
}: {
  type: CalloutType;
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
