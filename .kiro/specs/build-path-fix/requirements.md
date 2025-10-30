# Build Path Fix Requirements

## Introduction

This specification defines the requirements for fixing the Chrome extension build path mismatch. The TypeScript compiler outputs files to `dist/src/` structure, but the manifest.json references files directly under `dist/`, causing the extension to fail loading with "Could not load javascript" errors.

## Glossary

- **Build_System**: The TypeScript compiler and asset copying process that generates the dist/ directory
- **Manifest_Paths**: File path references in manifest.json that Chrome uses to load extension components
- **Output_Structure**: The directory structure created by the build process in the dist/ folder
- **Extension_Loading**: Chrome's process of reading manifest.json and loading referenced files
- **Path_Resolution**: The mechanism by which Chrome resolves file paths relative to the extension root

## Requirements

### Requirement 1

**User Story:** As a developer, I want the build system to output files where the manifest expects them, so that the Chrome extension loads without path errors.

#### Acceptance Criteria

1. WHEN the build process completes, THE Build_System SHALL place content-script.js at dist/content/content-script.js
2. WHEN the build process completes, THE Build_System SHALL place service-worker.js at dist/background/service-worker.js
3. WHEN the build process completes, THE Build_System SHALL place ai-processor.js at dist/offscreen/ai-processor.js
4. WHEN the build process completes, THE Build_System SHALL place UI components at dist/ui/ directory
5. WHEN Chrome loads the extension, THE Manifest_Paths SHALL correctly resolve to existing files

### Requirement 2

**User Story:** As a developer, I want consistent build output structure, so that all extension components can be loaded correctly by Chrome.

#### Acceptance Criteria

1. WHEN TypeScript compiles source files, THE Output_Structure SHALL match the expected manifest path structure
2. WHEN assets are copied, THE Build_System SHALL maintain the correct directory hierarchy
3. WHEN source maps are generated, THE Build_System SHALL place them alongside their corresponding JavaScript files
4. WHEN declaration files are generated, THE Build_System SHALL organize them to match the output structure
5. WHERE multiple build steps are involved, THE Build_System SHALL coordinate to produce consistent paths

### Requirement 3

**User Story:** As a developer, I want the build configuration to be maintainable, so that future changes don't break the path structure.

#### Acceptance Criteria

1. WHEN modifying TypeScript configuration, THE changes SHALL preserve the correct output directory structure
2. WHEN adding new source files, THE Build_System SHALL automatically place them in the correct output locations
3. WHEN the build process runs, THE Build_System SHALL validate that output paths match manifest expectations
4. IF output structure changes, THEN THE Build_System SHALL update manifest paths accordingly
5. WHEN debugging build issues, THE Build_System SHALL provide clear information about file placement

### Requirement 4

**User Story:** As a developer, I want the extension to load successfully after building, so that I can test and develop features without path-related errors.

#### Acceptance Criteria

1. WHEN loading the extension in Chrome, THE Extension_Loading SHALL succeed without file not found errors
2. WHEN the extension icon is clicked, THE content script SHALL be available at the expected path
3. WHEN the service worker starts, THE background script SHALL load from the correct location
4. WHEN offscreen documents are created, THE ai-processor script SHALL be accessible
5. WHEN web accessible resources are requested, THE UI components SHALL be available at correct paths
