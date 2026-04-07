# Project Documents

Store all project-related documents here. These are consumed by the **MOM Agent** and **User Stories Agent** to generate structured outputs.

## Folder Structure

```
project-docs/
├── transcripts/         # Meeting transcripts (.txt, .docx, .md)
├── recordings/          # Recorded video references or links (.md notes)
├── ba-workflows/        # BA workflow documents, process flows
├── client-documents/    # Client-shared documents, requirements, specs
└── screenshots/         # Screenshots, wireframes, mockups
```

## Naming Convention

Use descriptive names with date prefix for easy sorting:

- `YYYY-MM-DD-topic-description.md`
- Example: `2026-02-18-calendar-workflow-review.md`
- Example: `2026-02-15-discovery-session-3.md`

## Supported by Agents

| Agent | How It Uses These Docs |
|-------|----------------------|
| **MOM Agent** | Reads transcripts to generate Minutes of Meeting |
| **User Stories Agent** | Reads all docs to extract and generate user stories |
