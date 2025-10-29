# LLM Quick Reference Guide

This is a concise reference guide for LLMs to quickly understand and debug the Language Learning Chrome Extension.

## 🚀 Quick Start Commands

### Initialize Debugging Session

```typescript
const debugSession = new DebugSessionManager();
const sessionId = await debugSession.initializeDebugSession({
  contexts: ['service-worker', 'content-script', 'offscreen', 'ui'],
  captureConsole: true,
  captureNetwork: true,
  capturePerformance: true,
});
```

### Run Health Check

```typescript
const testExecutor = new TestScenarioExecutor();
const healthCheck = await testExecutor.executeScenario(
  'Extension Loading Test'
);
console.log('Health Check:', healthCheck.passed ? 'PASS' : 'FAIL');
```

### Generate Debug Report

```typescript
const reportGenerator = new DebugReportGenerator();
const report = await reportGenerator.generateReport(sessionId);
console.log('Report ID:', report.reportId);
```

## 🔍 Context-Specific Debugging

### Service Worker Issues

```typescript
const debugger = new ServiceWorkerDebugger();
await debugger.validateServiceWorkerRegistration();
await debugger.debugBackgroundProcessing();
await debugger.testMessageHandling();
```

### Content Script Issues

```typescript
const debugger = new ContentScriptDebugger();
await debugger.testContentScriptInjection();
await debugger.validateDOMAccess();
await debugger.testContentExtraction();
```

### AI Processing Issues

```typescript
const debugger = new OffscreenDebugger();
await debugger.testAIServiceAvailability();
await debugger.validateProcessingPipeline();
await debugger.testMemoryManagement();
```

### UI Component Issues

```typescript
const debugger = new UIComponentDebugger();
await debugger.testComponentRendering();
await debugger.testUserInteractions();
await debugger.testHighlightingSystem();
```

### Storage Issues

```typescript
const debugger = new StorageCachingDebugger();
await debugger.testStorageOperations();
await debugger.validateCacheBehavior();
await debugger.checkStorageQuotas();
```

## 📊 Performance Analysis

### Memory Monitoring

```typescript
const memoryMonitor = new MemoryMonitor();
await memoryMonitor.startMonitoring();
const snapshots = await memoryMonitor.getMemorySnapshots();
```

### Performance Optimization

```typescript
const optimizer = new DebugPerformanceOptimizer();
await optimizer.initializeOptimization();
const result = await optimizer.optimizeSession(sessionState);
```

### Efficiency Analysis

```typescript
const efficiencyMonitor = new DebugEfficiencyMonitor();
const efficiency = await efficiencyMonitor.measureEfficiency(sessionState);
const report = efficiencyMonitor.generateEfficiencyReport();
```

## 🏗️ Architecture Quick Reference

### File Structure

```
src/
├── background/service-worker.ts    # Extension lifecycle, message routing
├── content/content-script.ts       # DOM manipulation, content extraction
├── offscreen/ai-processor.ts       # AI processing, heavy computations
├── ui/                            # Learning interface, settings, setup
├── utils/                         # Shared services and utilities
└── types/index.ts                 # Centralized type definitions
```

### Message Flow

```
Content Script → Service Worker → Offscreen Document → UI Components
      ↓              ↓                    ↓              ↓
   DOM Access    Message Router      AI Processing   User Interface
```

### Storage Layers

```
Chrome Storage (sync/local) → Storage Manager → Cache Manager → Memory Storage
```

## 🚨 Common Issues & Quick Fixes

### Extension Won't Load

1. Check `manifest.json` syntax
2. Verify service worker path: `background/service-worker.js`
3. Ensure all files exist in `dist/`
4. Check permissions in manifest

### Content Script Not Injecting

1. Verify match patterns in manifest
2. Check host permissions
3. Test on supported pages
4. Examine CSP restrictions

### AI Processing Fails

1. Check Chrome Built-in AI availability
2. Verify offscreen document creation
3. Test Gemini API fallback
4. Check memory limits

### Storage Issues

1. Check storage permissions
2. Verify quota limits
3. Test data serialization
4. Check sync vs local storage

### Performance Problems

1. Monitor memory usage
2. Check for memory leaks
3. Optimize data structures
4. Enable performance optimizations

## 🔧 Debug Tools Quick Access

### Automated Testing

```typescript
// Run all tests
const automatedTests = new AutomatedTestScenarios();
const results = await automatedTests.executeComprehensive();

// Run specific category
await automatedTests.executeScenariosByCategory('service-worker');
```

### Continuous Monitoring

```typescript
const monitor = new ContinuousDebugMonitor();
await monitor.startMonitoring({
  interval: 300000,
  scenarios: ['Extension Loading Test', 'Content Script Test'],
  alertThresholds: { failureRate: 0.3, executionTime: 30000 },
});
```

### Report Generation

```typescript
const reportGeneration = new AutomatedReportGeneration();
const report = await reportGeneration.generateReport(sessionId, results, {
  formats: ['json', 'html', 'markdown'],
  includeRecommendations: true,
});
```

## 📋 Debugging Checklist

### Pre-Debug Setup

- [ ] MCP server running
- [ ] Extension loaded in dev mode
- [ ] Debug session initialized
- [ ] Permissions granted

### Issue Investigation

- [ ] Identify affected context
- [ ] Run appropriate debugger
- [ ] Capture performance data
- [ ] Generate debug report
- [ ] Analyze findings

### Resolution Validation

- [ ] Apply recommended fixes
- [ ] Re-run failed tests
- [ ] Verify performance impact
- [ ] Update documentation
- [ ] Set up monitoring

## 🎯 Key Debugging Patterns

### Error Investigation Pattern

```typescript
async function investigateError(error) {
  // 1. Capture context
  const context = await captureErrorContext(error);

  // 2. Run diagnostics
  const diagnostics = await runContextDiagnostics(context.type);

  // 3. Generate recommendations
  const recommendations = await generateRecommendations(diagnostics);

  // 4. Apply fixes
  await applyRecommendedFixes(recommendations);
}
```

### Performance Analysis Pattern

```typescript
async function analyzePerformance() {
  // 1. Baseline measurement
  const baseline = await capturePerformanceBaseline();

  // 2. Execute operations
  await executeTestOperations();

  // 3. Compare results
  const comparison = await comparePerformance(baseline);

  // 4. Optimize if needed
  if (comparison.degradation > threshold) {
    await applyOptimizations();
  }
}
```

### Integration Testing Pattern

```typescript
async function testIntegration() {
  // 1. Test message flow
  await testCrossContextCommunication();

  // 2. Test data flow
  await testDataPersistence();

  // 3. Test error handling
  await testErrorPropagation();

  // 4. Test recovery
  await testAutomatedRecovery();
}
```

## 📚 Essential Documentation

- **[Architecture Guide](./LLM_EXTENSION_ARCHITECTURE_GUIDE.md)** - Comprehensive system architecture
- **[Debugging Workflow](./LLM_DEBUGGING_WORKFLOW_GUIDE.md)** - Step-by-step debugging procedures
- **[Examination Guide](./LLM_CHROME_EXTENSION_EXAMINATION_GUIDE.md)** - Detailed examination methodology
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions
- **[Best Practices](./DEBUGGING_BEST_PRACTICES.md)** - Guidelines and recommendations

## 🔗 Useful Commands

### TypeScript Compilation

```bash
pnpm build                    # Compile TypeScript
pnpm dev                      # Watch mode compilation
pnpm type-check              # Type checking only
```

### Testing

```bash
pnpm test                     # Run all tests
pnpm test:watch              # Watch mode testing
pnpm test:coverage           # Coverage reports
```

### Validation

```bash
pnpm validate:extension      # Full validation pipeline
pnpm lint                    # Code linting
pnpm format                  # Code formatting
```

### Debug Validation

```bash
node debug/validate-simple.cjs              # Quick validation
node debug/validate-mcp-connection.js       # MCP connection test
```

## 💡 Pro Tips

1. **Start with Health Check**: Always run the extension loading test first
2. **Use Appropriate Context**: Match the debugger to the issue context
3. **Enable All Capture**: Turn on console, network, and performance capture
4. **Generate Reports**: Always generate reports for systematic analysis
5. **Monitor Performance**: Include performance analysis in every debug session
6. **Set Up Alerts**: Configure continuous monitoring for critical issues
7. **Document Findings**: Use the reporting system to track all issues
8. **Test Recovery**: Always validate that fixes resolve the original problem

This quick reference provides immediate access to the most commonly needed debugging commands and patterns for the Chrome Extension.
