import { useInstrument } from "../../../lib/hooks/useInstrument";

type PianoKeyProps = {
  note: string;
  isBlack?: boolean;
  disabled?: boolean;
};

export function PianoKey({
  note,
  isBlack = false,
  disabled = false,
}: PianoKeyProps) {
  const { playNote, stopNote, isLoading } = useInstrument();

  const handleMouseDown = () => {
    if (!disabled && !isLoading) playNote(note);
  };

  const handleMouseUp = () => {
    if (!disabled && !isLoading) stopNote(note);
  };

  return (
    <button
      className={`piano-key ${isBlack ? "black" : "white"} ${
        disabled || isLoading ? "disabled" : ""
      }`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={(e) => {
        e.preventDefault();
        handleMouseDown();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleMouseUp();
      }}
    >
      <span className="note-label">{note}</span>
    </button>
  );
}
