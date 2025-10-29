/**
 * Run MCP Integration Test
 */

import { testMCPIntegration } from './test-mcp-integration.js';

// Run the test
testMCPIntegration()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
