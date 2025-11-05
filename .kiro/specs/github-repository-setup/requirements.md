# Requirements Document

## Introduction

This feature establishes a dual-branch GitHub workflow for the Vocabeey Chrome Extension, where the `dev` branch contains all development artifacts and the `main` branch maintains a clean, production-ready state suitable for public distribution.

## Glossary

- **Dev Branch**: Development branch containing all working files, documentation, debug files, and build artifacts
- **Main Branch**: Production branch containing only essential source code, documentation, and configuration files
- **GitHub Remote**: The public GitHub repository at https://github.com/waghostel/Vocabeey-ChromeBuildInAI.git
- **GitLab Remote**: The private GitLab repository at https://gitlab.com/waghostel-group/vocabee.git
- **Cleanup Script**: Automated tool that removes development artifacts before pushing to main branch
- **Build Artifacts**: Compiled output in the `dist/` directory
- **Development Artifacts**: Temporary markdown files, debug files, and development-only documentation

## Requirements

### Requirement 1

**User Story:** As a project maintainer, I want to keep development files in the dev branch, so that I can work with all necessary documentation and debug files without cluttering the public repository

#### Acceptance Criteria

1. WHEN working on the dev branch, THE Repository SHALL include all development markdown files, debug folders, and temporary documentation
2. THE Repository SHALL track the `dist/` folder in the dev branch for quick testing and validation
3. THE .gitignore file SHALL be modified to allow `dist/` folder tracking in the dev branch
4. WHILE on the dev branch, THE Repository SHALL maintain all files needed for active development including coverage reports and debug outputs

### Requirement 2

**User Story:** As a project maintainer, I want the main branch to contain only production-ready files, so that users can easily understand and use the extension without confusion from development artifacts

#### Acceptance Criteria

1. THE Main Branch SHALL contain only source code, essential documentation, configuration files, and scripts
2. THE Main Branch SHALL exclude all development markdown files (e.g., _\_SUMMARY.md, _\_GUIDE.md, \*\_IMPLEMENTATION.md)
3. THE Main Branch SHALL exclude debug folders, demo pages, and development-only HTML test files
4. THE Main Branch SHALL exclude the `dist/` folder to keep the repository clean
5. THE Main Branch SHALL maintain the standard .gitignore that excludes `dist/` and other build artifacts
6. THE Main Branch SHALL include only the following documentation structure:
   - README.md
   - QUICK_START.md
   - docs/ directory with organized subdirectories
   - scripts/README.md

### Requirement 3

**User Story:** As a project maintainer, I want automated cleanup scripts, so that I can easily prepare the repository for pushing to the main branch without manual file deletion

#### Acceptance Criteria

1. THE Cleanup Script SHALL identify and list all files that should be removed before pushing to main
2. THE Cleanup Script SHALL provide a preview mode that shows what would be deleted without actually deleting
3. THE Cleanup Script SHALL remove development markdown files matching specific patterns
4. THE Cleanup Script SHALL remove debug folders and demo pages
5. THE Cleanup Script SHALL remove temporary HTML test files
6. THE Cleanup Script SHALL preserve all essential source code, tests, and configuration files
7. THE Cleanup Script SHALL provide a confirmation prompt before executing deletions

### Requirement 4

**User Story:** As a project maintainer, I want clear workflow documentation, so that I can consistently manage both branches and avoid mistakes when pushing to GitHub

#### Acceptance Criteria

1. THE Workflow Documentation SHALL describe the complete process for working with dev and main branches
2. THE Workflow Documentation SHALL include step-by-step instructions for cleaning and pushing to main
3. THE Workflow Documentation SHALL explain how to sync changes between dev and main branches
4. THE Workflow Documentation SHALL provide commands for managing the dual-remote setup (GitHub and GitLab)
5. THE Workflow Documentation SHALL include troubleshooting guidance for common issues

### Requirement 5

**User Story:** As a project maintainer, I want gitignore management scripts, so that I can easily switch between dev and main branch configurations

#### Acceptance Criteria

1. THE Gitignore Manager SHALL provide a command to configure .gitignore for dev branch (allowing dist/)
2. THE Gitignore Manager SHALL provide a command to configure .gitignore for main branch (excluding dist/)
3. THE Gitignore Manager SHALL preserve all other .gitignore rules when switching configurations
4. THE Gitignore Manager SHALL validate the .gitignore file after modifications
5. WHEN switching branches, THE System SHALL automatically apply the appropriate .gitignore configuration

### Requirement 6

**User Story:** As an end user, I want to download a clean, organized repository from GitHub, so that I can easily understand the project structure and install the extension

#### Acceptance Criteria

1. WHEN a user clones the main branch from GitHub, THE Repository SHALL contain only production-ready files
2. THE Repository SHALL have a clear README with installation instructions
3. THE Repository SHALL have organized documentation in the docs/ directory
4. THE Repository SHALL not contain confusing development artifacts or temporary files
5. THE Repository SHALL include all necessary source code and configuration to build the extension
