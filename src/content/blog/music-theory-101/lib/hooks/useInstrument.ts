import { useContext } from "react";
import InstrumentContext from "../contexts/InstrumentContext";

export function useInstrument() {
  const context = useContext(InstrumentContext);
  if (!context) {
    throw new Error("useInstrument must be used within an InstrumentProvider");
  }
  return context;
}
