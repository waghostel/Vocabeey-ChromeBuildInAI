# Implementation Plan

- [ ] 1. Fix AI Fallback Test Mock Configurations
  - Update mock service responses to return proper data instead of generic "test" strings
  - Configure realistic fallback scenarios with proper error handling
  - Ensure JSON responses are valid for vocabulary analysis
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.1 Fix Gemini API mock responses for language detection
  - Replace "test" response with valid language codes
  - Configure proper error throwing when all services fail
  - Set up sequential service failure simulation
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Fix Gemini API mock responses for content summarization
  - Replace generic "test" response with "Gemini summary" as expected by tests
  - Ensure fallback chain works when Chrome AI fails
  - Validate summary options are properly handled
  - _Requirements: 1.3_

- [ ] 1.3 Fix Gemini API mock responses for text translation
  - Replace "test" response with proper translation like "Bonjour le monde"
  - Configure language-specific translation responses
  - Ensure fallback behavior works correctly
  - _Requirements: 1.4_

- [ ] 1.4 Fix Gemini API mock responses for vocabulary analysis
  - Replace invalid "test" string with proper JSON structure
  - Create realistic vocabulary analysis response objects
  - Ensure proper array format with word definitions
  - _Requirements: 1.5_

- [ ] 1.5 Validate AI fallback error handling
  - Test that all services failing throws appropriate errors
  - Verify error messages contain expected content
  - Ensure resource cleanup works properly on destroy
  - _Requirements: 1.2_

- [ ] 2. Implement Cache Manager Test Isolation
  - Add proper test cleanup procedures to prevent state bleeding
  - Ensure each test starts with clean cache state
  - Fix cache checking and clearing functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2.1 Add comprehensive test cleanup procedures
  - Implement afterEach cleanup that clears all cache state
  - Reset cache manager instances between tests
  - Clear any persistent storage artifacts
  - _Requirements: 2.1, 2.4_

- [ ] 2.2 Fix cache status checking functionality
  - Ensure cache checking returns accurate results
  - Verify cache state is properly initialized before tests
  - Fix the "should check if article is cached" test expectation
  - _Requirements: 2.2_

- [ ] 2.3 Fix cache clearing functionality
  - Ensure clearAllCaches() completely removes all cached data
  - Verify cache clearing works across all cache types
  - Fix the "should clear all caches" test validation
  - _Requirements: 2.3_

- [ ] 3. Align Storage System Mock Expectations
  - Review storage initialization and migration logic
  - Align mock spy expectations with actual system behavior
  - Fix unnecessary storage operations in tests
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3.1 Fix storage initialization mock expectations
  - Analyze why storage.local.set is called during initialization
  - Align test expectations with actual initialization behavior
  - Ensure schema version checking works correctly
  - _Requirements: 3.1_

- [ ] 3.2 Fix storage migration mock expectations
  - Review migration logic to understand clear() calls
  - Align test expectations with actual migration behavior
  - Ensure no-op migrations don't perform unnecessary operations
  - _Requirements: 3.2_

- [ ] 3.3 Validate storage system behavior alignment
  - Ensure mock expectations match production storage behavior
  - Verify test isolation doesn't affect storage system tests
  - Validate storage operations work as expected
  - _Requirements: 3.3_

- [ ] 4. Execute comprehensive test validation
  - Run individual test files after each fix phase
  - Perform full test suite validation
  - Verify no regressions in existing passing tests
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.1 Validate AI fallback test fixes
  - Run npm test tests/ai-fallback.test.ts to verify 7 fixes
  - Ensure all AI fallback scenarios pass
  - Verify no regressions in related tests
  - _Requirements: 4.1, 4.3_

- [ ] 4.2 Validate cache manager test fixes
  - Run npm test tests/cache-manager.test.ts to verify 2 fixes
  - Ensure cache isolation works properly
  - Verify cache functionality tests pass
  - _Requirements: 4.1, 4.3_

- [ ] 4.3 Validate storage system test fixes
  - Run npm test tests/storage-system.test.ts to verify 2 fixes
  - Ensure storage mock expectations are met
  - Verify storage functionality works correctly
  - _Requirements: 4.1, 4.3_

- [ ] 4.4 Execute full test suite validation
  - Run npm test to verify all 721 tests pass
  - Ensure test execution completes within time limits
  - Verify zero failing tests and no regressions
  - _Requirements: 4.1, 4.2, 4.4_
