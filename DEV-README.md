# Development Preferences

This document outlines the default development preferences for this project.

## Default Styling Preferences

- **Color Format**: HSL (Hue, Saturation, Lightness)
- **CSS Framework**: Vanilla CSS (No Tailwind)

## How It Works

The `dev-preferences.json` file in the root directory contains configuration settings that define default preferences for code generation and styling within this project.

## Current Default Settings

```json
{
  "styling": {
    "colors": "hsl",
    "cssFramework": "vanilla"
  },
  "codeGeneration": {
    "avoidPackages": ["tailwindcss"],
    "preferredPackages": []
  },
  "documentation": {
    "includeComments": false
  }
}
```

## Modifying Preferences

To modify these preferences, simply edit the `dev-preferences.json` file and update the values as needed.

## Using with AI Assistants

When working with AI assistants on this project, you can reference this document or the configuration file to ensure the AI understands your preferences. You can say:

"Please follow the project preferences defined in dev-preferences.json"

This will help maintain consistency across all generated code.
