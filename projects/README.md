# Dynamic Projects System

This directory contains project portfolios that are automatically displayed on the website.

## How It Works

Each subdirectory in `/projects/` represents a project. The website reads these directories and generates project cards and detailed modal popups automatically.

## Adding a New Project

### 1. Create a Project Directory

Create a new subdirectory with your project name. Use underscores for spaces:

```
projects/
  Escape_Rooms/       <-- Your new project
    project.md        <-- Required: metadata and description
    cover.jpg         <-- Optional: main image for the card
    screenshot1.png   <-- Optional: additional gallery images
    demo.mp4          <-- Optional: video files
```

### 2. Create the project.md File

Every project needs a `project.md` file with YAML front matter:

```markdown
---
title: Escape Rooms
category: Interactive Experience
description: Brief description for the project card (1-2 sentences)
tech: Unity, C#, Puzzle Design
github: https://github.com/username/project
live: https://live-demo-url.com
order: 4
---

## Overview

Write your detailed project description here using Markdown.

### Key Features

- Feature one description
- Feature two description
- Feature three description

### Technical Details

More detailed information about how the project works...
```

### Front Matter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Display name of the project |
| `category` | Yes | Category badge (e.g., "Education Technology") |
| `description` | Yes | Short description for the project card |
| `tech` | Yes | Comma-separated list of technologies |
| `github` | No | GitHub repository URL |
| `live` | No | Live demo URL |
| `order` | No | Sort order (lower numbers appear first) |

### 3. Add Media Files

**Cover Image:**
- Name it `cover.jpg`, `cover.png`, `thumbnail.jpg`, or `preview.jpg`
- This will be the main image on the project card
- Recommended size: 800x450px (16:9 aspect ratio)

**Gallery Images:**
- Add additional images with any name (e.g., `screenshot1.png`, `feature.jpg`)
- These appear in the modal gallery slider

**Videos:**
- Add `.mp4`, `.webm`, or `.mov` files
- These appear in the modal gallery with playback controls

**Looping Videos (GIF-like):**
- Add `_loop` to the filename to make videos autoplay and loop silently
- Examples: `demo_loop.mp4`, `animation_loop.webm`, `preview_loop.mp4`
- Looping videos play automatically, are muted, and repeat continuously
- Great for short demos, animations, or UI interactions
- A small loop icon appears on looping videos in the gallery

### 4. Rebuild the Site (Optional)

If you're using the build script:

```bash
node build-projects.js
```

This regenerates the HTML with your new project. Otherwise, manually add your project to `index.html`.

## Example: Adding "Escape Rooms" Project

```bash
# Create the directory
mkdir projects/Escape_Rooms

# Add your files
projects/Escape_Rooms/
  project.md          # Required
  cover.jpg           # Main card image
  puzzle1.png         # Gallery image
  solution.mp4        # Regular video with controls
  ui_demo_loop.mp4    # Looping video (autoplays like a GIF)
```

**projects/Escape_Rooms/project.md:**
```markdown
---
title: Escape Rooms
category: Interactive Experience
description: Immersive digital escape room experiences with dynamic puzzles and collaborative solving.
tech: Unity, C#, WebGL
github: https://github.com/OPS-PIvers/EscapeRooms
order: 4
---

## Overview

A collection of browser-based escape room experiences...

### Features

- Multiple themed rooms
- Hint system
- Time tracking
- Multiplayer support
```

## Directory Structure

```
projects/
  README.md              <-- This file
  Doc2LMS/
    project.md
    cover.jpg
  Peer_Evaluator/
    project.md
    cover.jpg
  Spartan_Cup/
    project.md
    cover.jpg
  Escape_Rooms/          <-- Your new project
    project.md
    cover.jpg
    puzzle1.png
    demo.mp4
```

## Tips

1. **Image Optimization**: Use JPG for photos, PNG for screenshots with text
2. **Video Compression**: Keep videos under 10MB for fast loading
3. **Consistent Naming**: Use underscores in directory names, not spaces
4. **Order Field**: Use `order: 1, 2, 3...` to control display sequence
5. **Looping Videos**: Add `_loop` to filename for GIF-like behavior (e.g., `demo_loop.mp4`)
