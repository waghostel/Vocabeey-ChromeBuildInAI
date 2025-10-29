# Chrome Extension Debugging Environment

This directory contains debugging tools and utilities for the Language Learning Chrome Extension using chrome-devtools MCP.

## 📖 Documentation

### LLM-Specific Guides

- **[LLM Comprehensive Guide Index](./LLM_COMPREHENSIVE_GUIDE_INDEX.md)** - Master index for all LLM documentation
- **[LLM Quick Reference Guide](./LLM_QUICK_REFERENCE_GUIDE.md)** - Essential commands and patterns for immediate use
- **[LLM Extension Architecture Guide](./LLM_EXTENSION_ARCHITECTURE_GUIDE.md)** - Comprehensive system architecture overview
- **[LLM Chrome Extension Examination Guide](./LLM_CHROME_EXTENSION_EXAMINATION_GUIDE.md)** - Detailed examination methodology
- **[LLM Debugging Workflow Guide](./LLM_DEBUGGING_WORKFLOW_GUIDE.md)** - Step-by-step debugging procedures

### Core Debugging Documentation

- **[Debugging Workflow](./DEBUGGING_WORKFLOW.md)** - Complete step-by-step debugging process and procedures
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Solutions to common issues and systematic problem resolution
- **[Best Practices](./DEBUGGING_BEST_PRACTICES.md)** - Guidelines and best practices for effective debugging

### Implementation Summaries

- **[Service Worker Debugging](./SERVICE_WORKER_DEBUGGING_SUMMARY.md)** - Service worker debugging implementation
- **[UI Component Debugging](./UI_COMPONENT_DEBUGGING_SUMMARY.md)** - UI component debugging implementation
- **[Storage & Caching Debugging](./STORAGE_CACHING_DEBUGGING_SUMMARY.md)** - Storage and caching debugging implementation
- **[Cross-Component Integration](./CROSS_COMPONENT_INTEGRATION_DEBUGGING_SUMMARY.md)** - Integration debugging implementation
- **[Setup Complete](./SETUP_COMPLETE.md)** - Debugging environment setup summary

## Structure

- `session-manager/` - Debug session management and orchestration
- `contexts/` - Context-specific debugging tools
- `scenarios/` - Automated test scenarios
- `reports/` - Generated debugging reports
- `utils/` - Debugging utilities and helpers
- `monitoring/` - Continuous monitoring and alert systems
- `types/` - TypeScript type definitions

## Quick Start

### Prerequisites

- Chrome DevTools MCP server configured and running
- Extension loaded in Chrome with developer mode enabled
- Access to chrome-devtools MCP tools through Kiro

### Basic Usage

```typescript
// Initialize debugging session
const debugSession = new DebugSessionManager();
await debugSession.initialize();

// Debug specific context
const serviceWorkerDebugger = new ServiceWorkerDebugger();
await serviceWorkerDebugger.debugBackgroundProcessing();

// Run automated tests
const testExecutor = new TestScenarioExecutor();
await testExecutor.executeAllScenarios();

// Generate report
const reportGenerator = new DebugReportGenerator();
const report = await reportGenerator.generateReport();
```

## Workflow

1. **Initialize** - Start a debugging session using the session manager
2. **Select Context** - Choose appropriate context (service-worker, content-script, offscreen, ui)
3. **Debug** - Run test scenarios or manual debugging operations
4. **Analyze** - Generate reports and analyze findings
5. **Resolve** - Apply fixes and validate solutions

## Key Features

- **Comprehensive Context Coverage** - Debug all Chrome extension contexts
- **Automated Test Scenarios** - Predefined test cases for common issues
- **Real-time Monitoring** - Continuous monitoring with alerting
- **Detailed Reporting** - Structured reports with actionable recommendations
- **MCP Integration** - Direct Chrome DevTools integration via MCP

## Requirements Addressed

- **Requirement 1.1**: Service worker debugging capabilities
- **Requirement 2.1**: Content script monitoring and validation
- **Requirement 3.2**: AI processing debugging and optimization
- **Requirement 4.1**: UI component rendering and interaction debugging
- **Requirement 5.1**: Storage and caching system debugging
- **Requirement 6.1**: Cross-component integration debugging
- **Requirement 7.1**: Automated debugging workflows
- **Requirement 7.3**: Debugging report generation
- **Requirement 7.4**: Comprehensive debugging documentation

## Getting Started

For detailed instructions, see the **[Debugging Workflow](./DEBUGGING_WORKFLOW.md)** documentation.

For troubleshooting common issues, consult the **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)**.

For best practices and guidelines, review the **[Best Practices](./DEBUGGING_BEST_PRACTICES.md)** documentation.
