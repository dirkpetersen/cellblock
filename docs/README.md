# CellBlock Documentation

User and developer documentation for CellBlock, built with mkdocs-material.

## Prerequisites

- Python >= 3.8
- pip

## Setup

```bash
pip install mkdocs-material
```

## Development

```bash
# Serve docs locally with live reload
mkdocs serve

# Visit http://localhost:8000
```

## Build

```bash
# Build static site
mkdocs build

# Output in site/ directory
```

## Deployment

Documentation is automatically deployed to GitHub Pages at:
https://dirkpetersen.github.io/cellblock

## Structure

```
docs/
├── mkdocs.yml          # Configuration
└── docs/
    ├── index.md        # Landing page
    ├── user-guide/     # User documentation (primary)
    │   ├── getting-started.md
    │   ├── inmate-guide.md
    │   ├── warden-guide.md
    │   └── faq.md
    ├── developer-guide/ # Contributor docs
    │   ├── contributing.md
    │   ├── architecture.md
    │   └── deployment.md
    └── api/            # API reference
        ├── rest.md
        └── websocket.md
```

## Documentation Focus

- **Primary:** User-facing documentation (how to use the app)
- **Secondary:** Developer documentation (how to contribute)
- Write docs alongside feature development (not after)

## Style Guide

- Use clear, simple language
- Include screenshots and diagrams
- Step-by-step instructions
- Real-world examples
- Mobile-friendly formatting

## Contributing

See [CLAUDE.md](../CLAUDE.md) for documentation agent guidelines.
