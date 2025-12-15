---
title: Doc2LMS
category: Education Technology
description: Streamlined quiz creation tool that converts Google Documents into LMS-compatible formats with automated QTI export for Canvas and Blackboard.
tech: JavaScript, Google Apps Script, QTI
github: https://github.com/OPS-PIvers/Doc2LMS
order: 1
---

## Overview

Doc2LMS transforms the way educators create assessments by providing a seamless bridge between familiar Google Documents and Learning Management Systems.

### Key Features

- **Familiar Interface** - Write quizzes in Google Docs using simple formatting conventions
- **Automatic Conversion** - Transform documents into QTI-compliant packages
- **Multi-Platform Support** - Export to Canvas, Blackboard, and other QTI-compatible LMS platforms
- **Question Types** - Support for multiple choice, true/false, matching, and essay questions

### How It Works

1. Create your quiz in a Google Document using the formatting guide
2. Run the Doc2LMS script from the add-ons menu
3. Download the generated QTI package
4. Import directly into your LMS

### Technical Details

Built with Google Apps Script for seamless integration with Google Workspace. The application parses document structure and generates valid QTI XML that adheres to IMS Global specifications.
