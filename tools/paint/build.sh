#!/usr/bin/env bash
# Rebuild every painted image on the site from the generators.
# Needs: python3 with numpy, pillow (AVIF), opencv-contrib-python-headless;
#        node with playwright (Chromium).
# Usage: bash tools/paint/build.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../Website/Assets/scene"
tmp="$(mktemp -d)"
cd "$here"
python3 scene.py "$tmp/svg"
python3 gate.py "$tmp/svg"
python3 dusk.py "$tmp/svg"
node render.js "$tmp/svg" "$tmp/png" sky far mid near gate-wall gate-door-l gate-door-r dusk:2400:800
python3 encode.py "$tmp/png" "$out" \
  sky:960,1600,2400:noalpha:9 far:960,1600,2400 mid:960,1600,2400 near:960,1600,2400 \
  gate-wall:960,1600,2400 gate-door-l:960,1600,2400 gate-door-r:960,1600,2400 \
  dusk:1200,2400:noalpha:7
python3 og.py "$out"
rm -f "$out"/*-full.png
echo "done: $out"
