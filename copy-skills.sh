#!/bin/bash
# copy-skills.sh
# Aggregates skills from multiple sources into a single destination directory.
# Always overwrites existing files with the source version (clean replace).
# Usage: ./copy-skills.sh [path/to/skills-config.json]

set -euo pipefail

CONFIG_FILE="${1:-skills-config.json}"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Error: config file '$CONFIG_FILE' not found." >&2
  exit 1
fi

# Check dependencies
for cmd in jq rsync; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command '$cmd' is not installed." >&2
    exit 1
  fi
done

# Resolve config + destination to absolute paths so behavior is consistent
# regardless of where the script is invoked from.
CONFIG_DIR="$(cd "$(dirname "$CONFIG_FILE")" && pwd)"
CONFIG_FILE="$CONFIG_DIR/$(basename "$CONFIG_FILE")"

DESTINATION=$(jq -r '.destination' "$CONFIG_FILE")
# If destination is relative, resolve it against the config file's directory
if [[ "$DESTINATION" != /* ]]; then
  DESTINATION="$CONFIG_DIR/$DESTINATION"
fi

SKILL_COUNT=$(jq -r '.skills | length' "$CONFIG_FILE")

if [[ -z "$DESTINATION" || "$DESTINATION" == "null" ]]; then
  echo "Error: 'destination' not set in config." >&2
  exit 1
fi

mkdir -p "$DESTINATION"

echo "Aggregating $SKILL_COUNT skill(s) into: $DESTINATION"
echo "----------------------------------------"

for i in $(seq 0 $((SKILL_COUNT - 1))); do
  NAME=$(jq -r ".skills[$i].name" "$CONFIG_FILE")
  SOURCE=$(jq -r ".skills[$i].source" "$CONFIG_FILE")
  TARGET="$DESTINATION/$NAME"

  if [[ -z "$NAME" || "$NAME" == "null" ]]; then
    echo "[$((i+1))/$SKILL_COUNT] Skipping entry with no name."
    continue
  fi

  if [[ -z "$SOURCE" || "$SOURCE" == "null" ]]; then
    echo "[$((i+1))/$SKILL_COUNT] WARNING: '$NAME' has no source path (skipping)"
    continue
  fi

  if [[ ! -d "$SOURCE" ]]; then
    echo "[$((i+1))/$SKILL_COUNT] WARNING: source for '$NAME' not found: $SOURCE (skipping)"
    continue
  fi

  # Resolve to absolute paths for comparison
  SOURCE_ABS="$(cd "$SOURCE" && pwd)"
  TARGET_ABS="$DESTINATION/$NAME"

  # Safety check: refuse to operate if source == target (would wipe the source)
  if [[ "$SOURCE_ABS" == "$TARGET_ABS" ]]; then
    echo "[$((i+1))/$SKILL_COUNT] WARNING: source and target are the same path for '$NAME' (skipping to avoid wiping source)"
    echo "  path: $SOURCE_ABS"
    continue
  fi

  # Safety check: refuse if source is inside target (would wipe source)
  case "$SOURCE_ABS"/
    in "$TARGET_ABS"/*) echo "[$((i+1))/$SKILL_COUNT] WARNING: source '$SOURCE_ABS' is inside target '$TARGET_ABS' for '$NAME' (skipping)"; continue ;;
  esac

  # Safety check: refuse if target is inside source (deleting target would affect source's tree view)
  case "$TARGET_ABS"/
    in "$SOURCE_ABS"/*) echo "[$((i+1))/$SKILL_COUNT] WARNING: target '$TARGET_ABS' is inside source '$SOURCE_ABS' for '$NAME' (skipping)"; continue ;;
  esac

  echo "[$((i+1))/$SKILL_COUNT] $NAME"
  echo "  source: $SOURCE_ABS"
  echo "  target: $TARGET_ABS"

  # Remove existing target first to ensure a clean overwrite
  if [[ -e "$TARGET_ABS" || -L "$TARGET_ABS" ]]; then
    rm -rf "$TARGET_ABS"
  fi
  mkdir -p "$TARGET_ABS"

  # Copy contents (including hidden files) of source into target,
  # deleting any files in target that aren't in source.
  rsync -a --delete "$SOURCE_ABS/" "$TARGET_ABS/"
done

echo "----------------------------------------"
echo "Done."
