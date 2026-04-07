# Task: Generate Software Requirements Specification (SRS)

## Overview
Collect multiple project documents, analyze them, and generate a comprehensive SRS document following IEEE 830 standards.

## Prerequisites
- [ ] Project documents available (MOMs, transcripts, BA workflows, client specs, user stories)
- [ ] Documents placed in `project-docs/` folder or ready to share
- [ ] Any existing MOM outputs in `outputs/mom-agent/`
- [ ] Any existing user stories in `outputs/user-stories-agent/`

## Step-by-Step Workflow

### Step 1: Collect Documents
1. Agent asks for project documents
2. Auto-checks `project-docs/`, `outputs/mom-agent/`, `outputs/user-stories-agent/`
3. User provides additional documents (file paths, pasted content, or folder paths)
4. User confirms all documents are provided

### Step 2: Analyze Documents
1. Read and categorize each document (MOM, transcript, workflow, spec, etc.)
2. Extract requirements, actors, features, constraints from each
3. Cross-reference across documents for consistency
4. Identify conflicts and gaps
5. Present analysis summary to user

### Step 3: Generate SRS
1. Generate full SRS document with all sections:
   - Introduction, Scope, Definitions
   - Overall Description (product perspective, user classes, constraints)
   - Functional Requirements (FR-MODULE-NNN format)
   - Non-Functional Requirements (NFR-CATEGORY-NNN format)
   - Data Requirements (entities, data dictionary)
   - External Interfaces (UI, API, integrations)
   - Use Cases (UC-NNN format)
   - Traceability Matrix
   - Open Items & Gaps
2. Save to `outputs/srs-agent/SRS-{project}-{date}.md`

### Step 4: Review & Iterate
1. Present summary metrics (requirement counts, gaps, conflicts)
2. User reviews and provides feedback
3. Incorporate changes and update version
4. Optionally export as .docx

## Output Files
| File | Location |
|------|----------|
| SRS document (`.md`) | `outputs/srs-agent/SRS-{project}-{date}.md` |
| SRS document (`.docx`, optional) | `outputs/srs-agent/SRS-{project}-{date}.docx` |

## Invoke
```
/srs-agent
```

## Related Agents
- **MOM Agent** — generates MOMs that serve as SRS input
- **User Stories Agent** — generates user stories that feed into SRS
- **QA Architect** — uses SRS for test strategy planning
- **Test Case Generator** — uses SRS requirements for test cases
