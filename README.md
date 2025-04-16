# Steve's Blog

## Audio Samples

The project uses audio samples for various instruments in the music theory tutorials. These samples are stored in the `public/audio` directory and are converted to MP3 format for web compatibility.

### Available Instrument Samples

The project currently includes the following instrument samples:

- **Flute**: Converted from AIF format, covering octaves 3-6 with Db7
- **Cello**: Converted from AIF format, covering octaves 2-5
- **French Horn**: Converted from AIF format, covering octaves 1-5 (Bb1, B1 in octave 1, all notes in octaves 2-4, and C-F in octave 5)
- **Violin**: Converted from AIF format, covering octaves 4-6 completely, partial coverage of octave 3 (A, Ab, B, Bb only), and partial coverage of octave 7 (C, Db, D, Eb, E)
- **Xylophone**: Converted from AIF format, covering octaves 5-7 completely, partial coverage of octave 4 (F, Gb, G, Ab, A, Bb, B only), with C8 as the highest note

### Adding New Instrument Samples

To add new instrument samples:

1. Place the original audio files in a directory under `public/audio/[instrument-name]`
2. Run the conversion script to convert them to MP3 format:

```bash
node scripts/convert-audio-samples.js --instrument=[instrument-name] --input=public/audio/[instrument-name]
```

This will create a new directory `public/audio/[instrument-name]-mp3` with the converted samples.

3. Update the `SharedKeyboard.jsx` component to use the new samples:

```jsx
case INSTRUMENT_TYPES.[INSTRUMENT_NAME]:
  // Define the URLs for the instrument samples
  const instrumentUrls = {};

  // Add the sample URLs
  // ...

  // Create a sampler with the instrument samples
  newInstrument = new Tone.Sampler({
    urls: instrumentUrls,
    baseUrl: "/audio/[instrument-name]-mp3/",
    // ...
  }).toDestination();
  return;
```

4. Add the new instrument type to the `INSTRUMENT_TYPES` object in `SharedKeyboard.jsx`.

### Supported Audio Formats

The conversion script supports the following audio formats:

- AIF/AIFF
- WAV
- MP3
- OGG

### Sample Naming Convention

For best results, use a consistent naming convention for your samples:

- Use note names (C, C#, D, etc.) followed by octave number (e.g., C4, Db5)
- For sharps, you can use either # or b notation (C# or Db)
- The conversion script will map them to a standardized format

# Music Theory Components - Dark Mode Improvements

This directory contains shared components and styles for the Music Theory 101 interactive components.

## Dark Mode Improvements

The components have been updated to support dark mode with consistent styling across all components. The main improvements include:

1. **Shared CSS Variables**: A new `shared/dark-mode.css` file contains CSS variables for both light and dark modes, ensuring consistent colors and styling across all components.

2. **Component Backgrounds**: All components now use the shared background colors, with proper contrast in dark mode.

3. **Input Elements**: Form elements like inputs, selects, and buttons now have appropriate background colors in dark mode.

4. **Text Colors**: Text colors have been standardized with primary, secondary, and muted variants for better readability.

5. **Instructions**: Instruction text now has consistent styling with better contrast in dark mode.

## Usage

To use the shared styles in a component:

1. Import the shared styles:

```jsx
import "@/content/blog/shared/dark-mode.css;
```

2. Use the CSS variables in your component's CSS:

```css
.my-component {
  background-color: var(--component-bg);
  color: var(--text-primary);
  border: 1px solid var(--component-border);
}
```

## Available CSS Variables

### Colors

- `--primary-button`: Primary accent color
- `--primary-button-hover`: Hover state for primary color
- `--primary-button-light`: Lighter variant of primary color

### Component Backgrounds

- `--component-bg`: Main component background
- `--component-bg-darker`: Darker background for nested elements
- `--component-border`: Border color for components

### Input Elements

- `--input-bg`: Background for form inputs
- `--input-border`: Border color for inputs
- `--input-text`: Text color for inputs

### Text Colors

- `--text-primary`: Main text color
- `--text-secondary`: Secondary text color
- `--text-muted`: Muted/subtle text color

### Keyboard Colors

- `--white-key-bg`, `--white-key-hover`, `--white-key-active`: White key states
- `--black-key-bg`, `--black-key-hover`, `--black-key-active`: Black key states

### Container Styles

- `--container-shadow`: Shadow for component containers

## Utility Classes

The shared CSS also provides utility classes:

- `.music-theory-component`: Base styling for components
- `.music-theory-input`: Styling for inputs
- `.music-theory-select`: Styling for select dropdowns
- `.music-theory-button`: Styling for buttons
- `.music-theory-instruction`: Styling for instruction text
- `.music-theory-grid-cell`: Styling for grid cells/boxes

# Music Theory Interactive Components

This directory contains interactive components for the Music Theory 101 blog post series.

## Component Structure

Each component is organized in its own directory with the following structure:

- ComponentName.jsx: Main component file
- component-name.css: Component-specific styles
- index.jsx: Export file

## Shared Components and Styles

The `shared` directory contains common components and styles used across all music theory components:

- **SharedKeyboard**: Reusable piano keyboard component with instrument selection
- **InstrumentSelector**: Dropdown component for selecting instruments
- **shared/dark-mode.css**: Shared CSS variables and classes for consistent styling

## Common Container Class

All components use the `.demo-container` class for consistent container styling. This includes:

- Consistent background colors for dark/light mode
- Padding and margins
- Border styles
- Shadow effects
- Responsive adjustments

## CSS Variables

The shared CSS variables in `shared/dark-mode.css` allow for consistent theming across all components. Key variables include:

### Colors

- `--primary-button`: Primary accent color
- `--primary-button-hover`: Hover state for primary color
- `--primary-button-light`: Lighter variant of primary color

### Component Backgrounds

- `--component-bg`: Main component background
- `--component-bg-darker`: Darker background for nested elements
- `--component-border`: Border color for components

### Input Elements

- `--input-bg`: Background for form inputs
- `--input-border`: Border color for inputs
- `--input-text`: Text color for inputs

### Text Colors

- `--text-primary`: Main text color
- `--text-secondary`: Secondary text color
- `--text-muted`: Muted/subtle text color

## Usage Guidelines

### Adding a New Component

1. Create a new directory for your component in the components directory
2. Import the shared dark-mode.css file: `import "@/content/blog/shared/dark-mode.css;`
3. Use the demo-container class for your main container:

```jsx
<div className="demo-container">
  <VisuallyHidden as="h3">Component Title</VisuallyHidden>
  {/* Component content */}
</div>
```

### Using Shared Components

```jsx
import {
  SharedKeyboard,
  INSTRUMENT_TYPES,
  InstrumentSelector
} from "../shared";

// Use the shared keyboard
<SharedKeyboard
  onKeyClick={handleKeyClick}
  instrumentType={selectedInstrument}
  octaveRange={{ min: 3, max: 5 }}
  highlightedKeys={highlightedNotes}
/>

// Use the instrument dropdown
<InstrumentSelector
  selectedInstrument={selectedInstrument}
  onChange={handleInstrumentChange}
  label="Instrument:"
/>
```
