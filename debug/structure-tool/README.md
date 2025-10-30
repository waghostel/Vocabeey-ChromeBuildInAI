# Folder Structure Generator

Minimal tool to generate project folder structure for LLM analysis.

## Usage

```bash
# Show structure (default: current dir, depth 4)
node generate-structure.js

# Show structure of specific directory
node generate-structure.js /path/to/project

# Custom depth
node generate-structure.js /path/to/project 6

# Save to file
node generate-structure.js ../.. 4 > structure.txt

# Using npm scripts
npm run show      # Display structure
npm run generate  # Save to structure.txt
```

## Features

- Ignores: node_modules, .git, dist, coverage, debug, hidden files
- Sorts: directories first, then alphabetically
- Configurable depth limit (default: 4)
- Tree-style output for readability
