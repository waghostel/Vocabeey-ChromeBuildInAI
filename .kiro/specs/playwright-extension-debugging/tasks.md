# Implementation Plan

- [x] 1. Configure Playwright MCP server and verify connection
  - Add Playwright MCP server entry to mcp-config.json with proper configuration
  - Test MCP server connection by calling a simple Playwright function
  - Document any connection issues and resolution steps
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement extension loading and validation script
  - [x] 2.1 Create script to launch browser and load extension from dist/
    - Use mcp_playwright_browser_navigate to open chrome://extensions
    - Enable developer mode programmatically
    - Load unpacked extension from dist/ directory
    - Capture and log extension ID
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 2.2 Implement extension context verification
    - Check service worker registration status
    - Verify content script injection capability
    - Validate offscreen document availability
    - Confirm UI pages are accessible
    - _Requirements: 2.2, 2.3_

  - [x] 2.3 Add console error capture and analysis
    - Use mcp_playwright_browser_console_messages to retrieve all console logs
    - Filter and categorize errors by type (loading, runtime, import, path)
    - Generate error summary with file and line information
    - _Requirements: 2.4_

- [x] 3. Build path validation system
  - [x] 3.1 Implement manifest.json path validator
    - Read manifest.json from dist/ directory
    - Extract all file path references (service_worker, content_scripts, icons, web_accessible_resources)

    - Verify each referenced file exists at specified path
    - Report missing files with recommendations
    - _Requirements: 2.5_

  - [x] 3.2 Create JavaScript import path scanner
    - Read all compiled .js files from dist/
    - Extract import/export statements using regex or AST parsing
    - Identify imports missing .js extensions
    - Detect absolute paths that should be relative
    - Find incorrect relative path depths (wrong number of ../)
    - _Requirements: 2.4_

  - [x] 3.3 Generate path correction recommendations
    - For each path issue, suggest correct path
    - Provide TypeScript configuration recommendations
    - Generate automated fix script if possible
    - Document common path patterns and solutions
    - _Requirements: 2.4, 2.5_

- [x] 4. Implement content script injection testing
  - [x] 4.1 Create test page navigation and injection verification
    - Navigate to test page using mcp_playwright_browser_navigate
    - Wait for page load completion
    - Use mcp_playwright_browser_snapshot to capture page structure
    - Check for content script markers in accessibility tree
    - _Requirements: 3.1, 3.2_
  - [x] 4.2 Test content script functionality
    - Use mcp_playwright_browser_evaluate to check for content script globals
    - Verify DOM manipulation capabilities
    - Test message passing between content script and service worker
    - Capture any injection or execution errors
    - _Requirements: 3.3, 3.4_
  - [x] 4.3 Add content script error detection
    - Monitor console for content script errors
    - Check for CSP violations
    - Verify script execution timing
    - Generate injection failure analysis
    - _Requirements: 3.5_

- [x] 5. Create article processing workflow test
  - [x] 5.1 Implement article page navigation and action trigger
    - Navigate to article page with extractable content
    - Capture initial page state with screenshot
    - Click extension action button using mcp_playwright_browser_click
    - Monitor for processing start indicators
    - _Requirements: 4.1_

  - [x] 5.2 Monitor processing pipeline across contexts
    - Track service worker processing messages
    - Monitor offscreen document AI processing
    - Verify cache manager operations
    - Check storage manager data persistence

    - _Requirements: 4.2_

  - [x] 5.3 Validate learning interface rendering
    - Wait for learning interface to open in new tab
    - Use mcp_playwright_browser_snapshot to capture UI structure
    - Verify article content is displayed correctly
    - Check for vocabulary highlighting elements

    - Take screenshot of rendered interface

    - _Requirements: 4.3, 4.4_

  - [x] 5.4 Test interactive features
    - Click vocabulary cards to test translation display
    - Toggle sentence mode and verify highlighting
    - Test difficulty level changes
    - Verify TTS button functionality
    - _Requirements: 4.5_

- [x] 6. Build visual debugging system
  - [x] 6.1 Implement screenshot capture at key workflow points
    - Capture screenshot after extension loads
    - Take screenshot when content script injects
    - Capture article processing states
    - Screenshot learning interface rendering
    - Save screenshots with descriptive names and timestamps
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Create accessibility snapshot system
    - Capture snapshots at same points as screenshots
    - Save snapshots as text files for easy diffing
    - Extract element references (uid) for interaction testing
    - Generate snapshot comparison reports
    - _Requirements: 5.3_

  - [x] 6.3 Organize debugging artifacts
    - Create timestamped report directories
    - Organize screenshots by scenario
    - Group snapshots with corresponding screenshots
    - Include console logs and network requests
    - _Requirements: 5.4, 5.5_

- [x] 7. Implement user interaction testing
  - [x] 7.1 Test vocabulary card interactions
    - Use mcp_playwright_browser_click to click vocabulary cards
    - Verify translation popup appears
    - Check translation content accuracy
    - Capture interaction screenshots
    - _Requirements: 6.1_

  - [x] 7.2 Test sentence mode functionality
    - Click sentence mode toggle button
    - Verify sentence highlighting activates
    - Test sentence click for contextual translation
    - Validate sentence mode UI changes
    - _Requirements: 6.2_

  - [x] 7.3 Test TTS and audio features
    - Click TTS buttons for vocabulary and sentences
    - Monitor for audio playback indicators
    - Verify TTS service initialization
    - Check for audio-related errors
    - _Requirements: 6.3_

  - [x] 7.4 Test settings and configuration
    - Navigate to settings page
    - Test difficulty level changes
    - Verify settings persistence
    - Test keyboard navigation
    - _Requirements: 6.4, 6.5_

- [x] 8. Add performance monitoring
  - [x] 8.1 Measure page load and initialization times
    - Record extension installation time
    - Measure content script injection time
    - Track article processing duration
    - Calculate UI rendering time
    - _Requirements: 7.1_
  - [x] 8.2 Monitor AI processing performance
    - Measure Chrome AI API response times
    - Track offscreen document processing duration
    - Monitor batch processing performance
    - Identify processing bottlenecks
    - _Requirements: 7.2_
  - [x] 8.3 Track memory and resource usage
    - Use mcp_playwright_browser_evaluate with performance.memory
    - Monitor storage quota usage
    - Track cache size and hit rates
    - Identify memory leaks
    - _Requirements: 7.3_
  - [x] 8.4 Analyze network requests
    - Use mcp_playwright_browser_network_requests to get all requests
    - Identify slow API calls
    - Check for failed requests
    - Measure total network overhead
    - _Requirements: 7.4_
  - [x] 8.5 Generate performance report
    - Compile all performance metrics
    - Identify optimization opportunities
    - Provide actionable recommendations
    - Compare against performance baselines
    - _Requirements: 7.5_

- [x] 9. Implement error handling and edge case testing
  - [x] 9.1 Test pages with no extractable content
    - Navigate to pages without article content
    - Verify graceful error handling
    - Check for user-friendly error messages
    - Test fallback content extraction methods

    - _Requirements: 8.1_

  - [x] 9.2 Test AI service unavailability scenarios
    - Simulate Chrome AI API unavailability
    - Verify Gemini API fallback activation
    - Test error messages when all AI services fail
    - Validate retry logic

    - _Requirements: 8.2_

  - [x] 9.3 Test storage quota exceeded scenarios
    - Fill storage to near quota limit
    - Trigger operations that require storage
    - Verify quota exceeded error handling

    - Test cache cleanup mechanisms
    - _Requirements: 8.3_

  - [x] 9.4 Test network failure scenarios
    - Simulate offline mode
    - Test network request failures

    - Verify offline handler activation
    - Check cached content availability
    - _Requirements: 8.4_

  - [x] 9.5 Validate error message quality
    - Review all error messages for clarity
    - Verify recovery guidance is provided
    - Check error message localization
    - Test error reporting mechanisms
    - _Requirements: 8.5_

- [x] 10. Create automated test scenarios
  - [x] 10.1 Build basic article extraction test scenario
    - Create reusable test function for article extraction
    - Include all validation steps
    - Add screenshot and snapshot capture
    - Generate scenario-specific report
    - _Requirements: 9.1_
  - [x] 10.2 Build vocabulary workflow test scenario
    - Test complete vocabulary highlighting workflow
    - Include translation display testing
    - Verify vocabulary card interactions
    - Capture workflow screenshots
    - _Requirements: 9.2_
  - [x] 10.3 Build sentence mode test scenario
    - Test sentence mode activation and usage
    - Verify contextual translation
    - Test sentence highlighting accuracy
    - Document sentence mode behavior
    - _Requirements: 9.3_
  - [x] 10.4 Build TTS functionality test scenario
    - Test TTS for vocabulary and sentences
    - Verify audio playback
    - Check TTS service initialization
    - Test TTS error handling
    - _Requirements: 9.4_
  - [x] 10.5 Build settings configuration test scenario
    - Test all settings options
    - Verify settings persistence
    - Test settings impact on functionality
    - Validate settings UI
    - _Requirements: 9.5_

- [ ] 11. Build comprehensive debugging report generator
  - [ ] 11.1 Create report structure and templates
    - Define report sections (summary, findings, recommendations)
    - Create markdown templates for reports
    - Design report organization structure

    - Include metadata (timestamp, version, environment)
    - _Requirements: 10.1_

  - [ ] 11.2 Aggregate test results and artifacts
    - Collect all test scenario results
    - Organize screenshots by scenario
    - Include console logs and network requests
    - Add performance metrics
    - _Requirements: 10.2_
  - [ ] 11.3 Generate actionable recommendations
    - Analyze test failures and errors
    - Identify common patterns
    - Provide specific fix suggestions
    - Prioritize recommendations by severity
    - _Requirements: 10.3_
  - [ ] 11.4 Create report navigation and indexing
    - Generate table of contents
    - Create links between related findings
    - Add quick navigation to screenshots
    - Include search-friendly formatting
    - _Requirements: 10.4_
  - [ ] 11.5 Support multiple report formats
    - Generate markdown reports
    - Create HTML reports with embedded images
    - Support JSON export for automation
    - Enable report sharing and archiving
    - _Requirements: 10.5_

- [ ] 12. Document debugging workflow and best practices
  - Create user guide for running Playwright debugging
  - Document common issues and solutions
  - Provide troubleshooting guide
  - Include example debugging sessions
  - _Requirements: 1.4, 2.4, 8.5_
