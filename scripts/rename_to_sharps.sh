#!/bin/bash

# Script to rename audio files from flat notation to sharp notation
# Mapping:
# Db -> C#
# Eb -> D#
# Gb -> F#
# Ab -> G#
# Bb -> A#

# Function to rename files in a directory
rename_in_dir() {
  local dir=$1
  echo "Processing directory: $dir"

  # Rename Db to C#
  for file in "$dir"/Db*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/Db/C#/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename Eb to D#
  for file in "$dir"/Eb*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/Eb/D#/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename Gb to F#
  for file in "$dir"/Gb*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/Gb/F#/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename Ab to G#
  for file in "$dir"/Ab*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/Ab/G#/g')
      echo "Renaming $file to $new_file"
      mv "$file" "$new_file"
    fi
  done

  # Rename Bb to A#
  for file in "$dir"/Bb*.mp3; do
    if [ -f "$file" ]; then
      new_file=$(echo "$file" | sed 's/Bb/A#/g')
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
