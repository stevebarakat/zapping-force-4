#!/usr/bin/env node

/**
 * Audio Sample Converter
 *
 * This script converts audio samples from various formats (AIF, WAV, etc.) to MP3 format
 * for use in web applications. It organizes the converted files into a structured directory
 * based on instrument type.
 *
 * Usage:
 *   node convert-audio-samples.js --input=/path/to/samples --instrument=flute
 *
 * Options:
 *   --input        Path to the directory containing the audio samples
 *   --output       Path to the output directory (default: public/audio/[instrument]-mp3)
 *   --instrument   Type of instrument (flute, piano, violin, etc.)
 *   --format       Output format (default: mp3)
 *   --quality      Output quality for MP3 (0-9, lower is better quality, default: 2)
 *   --pattern      Glob pattern to match input files (default: *.{aif,aiff,wav})
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define interface for command line arguments
interface Args {
  input?: string;
  output?: string;
  instrument?: string;
  format?: string;
  quality?: string;
  pattern?: string;
  [key: string]: string | undefined;
}

// Parse command line arguments
const args = process.argv.slice(2).reduce<Args>((acc, arg) => {
  const [key, value] = arg.split("=");
  if (key && value) {
    acc[key.replace(/^--/, "")] = value;
  }
  return acc;
}, {});

// Default configuration
const config = {
  input: args.input || "public/audio/flute",
  output: args.output || `public/audio/${args.instrument || "flute"}-mp3`,
  instrument: args.instrument || "flute",
  format: args.format || "mp3",
  quality: args.quality || "2",
  pattern: args.pattern || "*.{aif,aiff,wav}",
};

// Type definition for output template function
type OutputTemplateFunction = (note: string, octave: string) => string;

// Define interface for instrument configurations
interface InstrumentConfig {
  filenameRegex?: RegExp;
  regex?: RegExp;
  outputTemplate: OutputTemplateFunction;
}

// Define instrument-specific configurations
const instrumentConfigs: Record<string, InstrumentConfig> = {
  flute: {
    filenameRegex: /([A-G][b#]?)(\d)\.aif/,
    outputTemplate: (note: string, octave: string) =>
      `${note.replace("#", "s")}${octave}.mp3`,
  },
  cello: {
    regex: /Cello\.arco\.ff\.sul[ACGD]\.([A-G][b#]?)(\d)\.stereo\.aif/,
    outputTemplate: (note: string, octave: string) =>
      `${note.replace("#", "s")}${octave}.mp3`,
  },
  horn: {
    regex: /Horn\.ff\.([A-G][b#]?)(\d)\.stereo\.aif/,
    outputTemplate: (note: string, octave: string) =>
      `${note.replace("#", "s")}${octave}.mp3`,
  },
  violin: {
    regex: /([A-G][b#]?)(\d)\.aif/,
    outputTemplate: (note: string, octave: string) =>
      `${note.replace("#", "s")}${octave}.mp3`,
  },
  piano: {
    // piano_NOTE_OCTAVE.wav -> NOTE_OCTAVE.mp3
    filenameRegex: /piano_([A-G]#?)(\d)\.wav/,
    outputTemplate: (note: string, octave: string) =>
      `${note.replace("#", "s")}${octave}.${config.format}`,
  },
  // Add more instruments as needed
  default: {
    // Default regex that tries to extract note and octave from filename
    filenameRegex: /([A-G][b#]?)(\d)/,
    outputTemplate: (note: string, octave: string) =>
      `${note.replace("#", "s")}${octave}.${config.format}`,
  },
};

// Map of note names from various formats to standardized format
const noteMap: Record<string, string> = {
  // Flats to Sharps
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  // Natural notes
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  A: "A",
  B: "B",
  // Keep sharps as they are
  "C#": "C#",
  "D#": "D#",
  "F#": "F#",
  "G#": "G#",
  "A#": "A#",
};

async function convertFiles() {
  try {
    // Get the instrument configuration
    const instrumentConfig =
      instrumentConfigs[config.instrument] || instrumentConfigs.default;

    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.output)) {
      fs.mkdirSync(config.output, { recursive: true });
    }

    // Find all matching audio files in the input directory
    const files = globSync(path.join(config.input, config.pattern));

    console.log(`Found ${files.length} audio files to convert`);

    for (const file of files) {
      const filename = path.basename(file);
      const regex = instrumentConfig.filenameRegex || instrumentConfig.regex;
      if (!regex) {
        console.warn(
          `No regex pattern defined for instrument: ${config.instrument}`
        );
        continue;
      }

      const match = filename.match(regex);

      if (match) {
        const [_, note, octave] = match;
        const mappedNote = note in noteMap ? noteMap[note] : note;

        if (mappedNote) {
          const outputFilename = instrumentConfig.outputTemplate(
            mappedNote,
            octave
          );
          const outputPath = path.join(config.output, outputFilename);

          console.log(`Converting ${filename} to ${outputFilename}...`);

          try {
            // Use ffmpeg to convert the audio file
            const command = `ffmpeg -i "${file}" -codec:a libmp3lame -qscale:a ${config.quality} "${outputPath}" -y`;
            await execPromise(command);
            console.log(
              `Successfully converted ${filename} to ${outputFilename}`
            );
          } catch (error) {
            const err = error as Error;
            console.error(`Error converting ${filename}:`, err.message);
          }
        } else {
          console.warn(`Could not map note ${note} for file ${filename}`);
        }
      } else {
        console.warn(`Could not parse filename: ${filename}`);
      }
    }

    console.log("Conversion complete!");
  } catch (error) {
    const err = error as Error;
    console.error("Error during conversion:", err.message);
  }
}

// Display configuration
console.log("Audio Sample Converter");
console.log("=====================");
console.log("Configuration:");
console.log(`  Input directory: ${config.input}`);
console.log(`  Output directory: ${config.output}`);
console.log(`  Instrument: ${config.instrument}`);
console.log(`  Output format: ${config.format}`);
console.log(`  Quality: ${config.quality}`);
console.log(`  File pattern: ${config.pattern}`);
console.log("=====================");

// Run the conversion
convertFiles();
