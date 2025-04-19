import { useState, useEffect } from "react";
import StaffNoteExplorer from "./StaffNoteExplorer";
import ClefExplorer from "./ClefExplorer";
import NoteValueExplorer from "./NoteValueExplorer";
import InteractiveStaff from "./InteractiveStaff";
import RhythmNotationExplorer from "./RhythmNotationExplorer";
import KeySignatureReader from "./KeySignatureReader";
import TimeSignatureExplorer from "./TimeSignatureExplorer";
import ScoreReader from "./ScoreReader";

function ClientWrapper({ Component }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <Component />;
}

export function ClientStaffNoteExplorer() {
  return <ClientWrapper Component={StaffNoteExplorer} />;
}

export function ClientClefExplorer() {
  return <ClientWrapper Component={ClefExplorer} />;
}

export function ClientNoteValueExplorer() {
  return <ClientWrapper Component={NoteValueExplorer} />;
}

export function ClientInteractiveStaff() {
  return <ClientWrapper Component={InteractiveStaff} />;
}

export function ClientRhythmNotationExplorer() {
  return <ClientWrapper Component={RhythmNotationExplorer} />;
}

export function ClientKeySignatureReader() {
  return <ClientWrapper Component={KeySignatureReader} />;
}

export function ClientTimeSignatureExplorer() {
  return <ClientWrapper Component={TimeSignatureExplorer} />;
}

export function ClientScoreReader() {
  return <ClientWrapper Component={ScoreReader} />;
}
