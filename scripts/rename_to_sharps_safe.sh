#!/bin/bash

# Script to rename audio files with URL-safe names
# Mapping:
# C#.mp3 -> Cs.mp3
# D#.mp3 -> Ds.mp3
# F#.mp3 -> Fs.mp3
# G#.mp3 -> Gs.mp3
# A#.mp3 -> As.mp3

# Function to rename files in a directory
rename_in_dir() {
  local dir=$1
  echo "Processing directory: $dir"

  # Rename C# to Cs
  for file in "$dir"/C\#*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/C#/Cs/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename D# to Ds
  for file in "$dir"/D\#*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/D#/Ds/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename F# to Fs
  for file in "$dir"/F\#*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/F#/Fs/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename G# to Gs
  for file in "$dir"/G\#*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/G#/Gs/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename A# to As
  for file in "$dir"/A\#*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/A#/As/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done
}

# Process each instrument directory
for dir in public/audio/*-mp3; do
  if [ -d "$dir" ]; then
    rename_in_dir "$dir"
  fi
done

echo "Renaming complete!"
