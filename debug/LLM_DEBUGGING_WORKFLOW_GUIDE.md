# LLM Debugging Workflow Guide

This guide provides step-by-step workflows for LLMs to systematically debug the Language Learning Chrome Extension using the comprehensive debugging infrastructure.

## 🚀 Quick Start Debugging Workflow

### 1. Initial Setup and Validation

```typescript
// Step 1: Initialize debugging environment
const debugSession = new DebugSessionManager();
const sessionId = await debugSession.initializeDebugSession({
  timeout: 300000,
  contexts: ['service-worker', 'content-script', 'offscreen', 'ui'],
  captureConsole: true,
  captureNetwork: true,
  capturePerformance: true,
  captureMemory: true,
});

// Step 2: Validate MCP connection
const mcpValidator = require('./validate-mcp-connection.js');
await mcpValidator.validateConnection();

// Step 3: Run basic health check
const testExecutor = new TestScenarioExecutor();
const healthCheck = await testExecutor.executeScenario(
  'Extension Loading Test'
);
```

### 2. Context-Specific Debugging

Choose the appropriate context based on the issue:

#### Service Worker Issues

```typescript
const serviceWorkerDebugger = new ServiceWorkerDebugger();

// Test service worker registration
await serviceWorkerDebugger.validateServiceWorkerRegistration();

// Test background processing
await serviceWorkerDebugger.debugBackgroundProcessing();

// Test message handling
await serviceWorkerDebugger.testMessageHandling();
```

#### Content Script Issues

```typescript
const contentScriptDebugger = new ContentScriptDebugger();

// Test content script injection
await contentScriptDebugger.testContentScriptInjection();

// Test DOM manipulation
await contentScriptDebugger.testDOMManipulation();

// Test content extraction
await contentScriptDebugger.testContentExtraction();
```

#### AI Processing Issues

```typescript
const offscreenDebugger = new OffscreenDebugger();

// Test AI service availability
await offscreenDebugger.testAIServiceAvailability();

// Test processing pipeline
await offscreenDebugger.validateProcessingPipeline();

// Test memory management
await offscreenDebugger.testMemoryManagement();
```

#### UI Component Issues

```typescript
const uiDebugger = new UIComponentDebugger();

// Test component rendering
await uiDebugger.testComponentRendering();

// Test user interactions
await uiDebugger.testUserInteractions();

// Test highlighting system
await uiDebugger.testHighlightingSystem();
```

### 3. Generate and Analyze Report

```typescript
// Generate comprehensive report
const reportGenerator = new DebugReportGenerator();
const report = await reportGenerator.generateReport(sessionId);

// Analyze findings
console.log('Report Summary:', report.summary);
console.log(
  'Critical Issues:',
  report.recommendations.filter(r => r.severity === 'critical')
);
```

## 🔍 Systematic Issue Investigation

### Workflow 1: Extension Won't Load

**Symptoms**: Extension shows errors in chrome://extensions/ or fails to activate

**Investigation Steps**:

1. **Validate Manifest**

   ```typescript
   // Check manifest.json syntax and structure
   const manifestPath = './manifest.json';
   const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

   // Validate required fields
   const requiredFields = [
     'manifest_version',
     'name',
     'version',
     'permissions',
   ];
   const missingFields = requiredFields.filter(field => !manifest[field]);
   if (missingFields.length > 0) {
     console.error('Missing required fields:', missingFields);
   }
   ```

2. **Check File Structure**

   ```typescript
   // Verify all referenced files exist
   const serviceWorkerDebugger = new ServiceWorkerDebugger();
   await serviceWorkerDebugger.validateFileStructure();
   ```

3. **Test Service Worker Registration**

   ```typescript
   await serviceWorkerDebugger.validateServiceWorkerRegistration();
   ```

4. **Check Permissions**
   ```typescript
   await serviceWorkerDebugger.validatePermissions();
   ```

### Workflow 2: Content Script Not Working

**Symptoms**: Content scripts not injecting or executing on target pages

**Investigation Steps**:

1. **Validate Injection**

   ```typescript
   const contentScriptDebugger = new ContentScriptDebugger();
   await contentScriptDebugger.testContentScriptInjection();
   ```

2. **Check Match Patterns**

   ```typescript
   // Verify content script match patterns
   await contentScriptDebugger.validateMatchPatterns();
   ```

3. **Test DOM Access**

   ```typescript
   await contentScriptDebugger.validateDOMAccess();
   ```

4. **Check CSP Restrictions**
   ```typescript
   await contentScriptDebugger.testCSPCompliance();
   ```

### Workflow 3: AI Processing Failures

**Symptoms**: AI features not working, processing timeouts, or errors

**Investigation Steps**:

1. **Check AI Service Availability**

   ```typescript
   const offscreenDebugger = new OffscreenDebugger();
   await offscreenDebugger.testAIServiceAvailability();
   ```

2. **Test Offscreen Document Creation**

   ```typescript
   await offscreenDebugger.testOffscreenDocumentCreation();
   ```

3. **Validate Processing Pipeline**

   ```typescript
   await offscreenDebugger.validateProcessingPipeline();
   ```

4. **Test Fallback Mechanisms**
   ```typescript
   await offscreenDebugger.testFallbackMechanisms();
   ```

### Workflow 4: Storage and Caching Issues

**Symptoms**: Data not persisting, cache misses, or storage errors

**Investigation Steps**:

1. **Test Storage Operations**

   ```typescript
   const storageCachingDebugger = new StorageCachingDebugger();
   await storageCachingDebugger.testStorageOperations();
   ```

2. **Validate Cache Behavior**

   ```typescript
   await storageCachingDebugger.validateCacheBehavior();
   ```

3. **Check Storage Quotas**

   ```typescript
   await storageCachingDebugger.checkStorageQuotas();
   ```

4. **Test Data Persistence**
   ```typescript
   await storageCachingDebugger.testDataPersistence();
   ```

### Workflow 5: Performance Issues

**Symptoms**: Slow performance, high memory usage, or timeouts

**Investigation Steps**:

1. **Analyze Performance Metrics**

   ```typescript
   const performanceOptimizer = new DebugPerformanceOptimizer();
   await performanceOptimizer.initializeOptimization();

   const analysis =
     await performanceOptimizer.analyzeSessionPerformance(sessionState);
   console.log('Performance Analysis:', analysis);
   ```

2. **Monitor Memory Usage**

   ```typescript
   const memoryMonitor = new MemoryMonitor();
   await memoryMonitor.startMonitoring();

   // Wait for data collection
   setTimeout(async () => {
     const snapshots = await memoryMonitor.getMemorySnapshots();
     console.log('Memory Snapshots:', snapshots);
   }, 30000);
   ```

3. **Optimize Performance**

   ```typescript
   const optimization =
     await performanceOptimizer.optimizeSession(sessionState);
   console.log('Optimization Results:', optimization);
   ```

4. **Generate Efficiency Report**
   ```typescript
   const efficiencyMonitor = new DebugEfficiencyMonitor();
   const efficiencyReport = await efficiencyMonitor.generateEfficiencyReport();
   console.log('Efficiency Report:', efficiencyReport);
   ```

## 🔄 Automated Debugging Workflows

### Comprehensive Test Suite

```typescript
// Run all automated test scenarios
const automatedTests = new AutomatedTestScenarios();
await automatedTests.initialize();

// Execute comprehensive test suite
const results = await automatedTests.executeComprehensive({
  includePerformanceTests: true,
  includeIntegrationTests: true,
  stopOnFailure: false,
});

// Analyze results
const validationSummary = automatedTests.generateValidationSummary(results);
console.log('Test Results Summary:', validationSummary);
```

### Continuous Monitoring Setup

```typescript
// Set up continuous monitoring
const continuousMonitor = new ContinuousDebugMonitor();
await continuousMonitor.startMonitoring({
  enabled: true,
  interval: 300000, // 5 minutes
  scenarios: [
    'Extension Loading Test',
    'Content Script Test',
    'AI Processing Test',
    'Storage Operations Test',
  ],
  alertThresholds: {
    failureRate: 0.3,
    executionTime: 30000,
    memoryUsage: 200,
  },
  notifications: {
    console: true,
  },
});

// Monitor for alerts
continuousMonitor.addEventListener('alert_generated', event => {
  console.log('Alert Generated:', event.data);
});
```

### Automated Report Generation

```typescript
// Generate automated reports
const reportGeneration = new AutomatedReportGeneration();

const report = await reportGeneration.generateReport(
  sessionId,
  results,
  validationSummary,
  {
    includeRecommendations: true,
    formats: ['json', 'html', 'markdown'],
    autoSave: true,
    minSeverityLevel: 'medium',
  }
);

console.log('Generated Report:', report.reportId);
```

## 🎯 Context-Specific Debugging Patterns

### Service Worker Debugging Pattern

```typescript
async function debugServiceWorker() {
  const debugger = new ServiceWorkerDebugger();

  // 1. Validate registration
  const registration = await debugger.validateServiceWorkerRegistration();
  if (!registration.isValid) {
    console.error('Service Worker Registration Issues:', registration.violations);
    return;
  }

  // 2. Test lifecycle events
  await debugger.testServiceWorkerLifecycle();

  // 3. Test message handling
  await debugger.testMessageHandling();

  // 4. Test background processing
  await debugger.debugBackgroundProcessing();

  // 5. Generate context-specific report
  const report = await debugger.generateContextReport();
  console.log('Service Worker Debug Report:', report);
}
```

### Content Script Debugging Pattern

```typescript
async function debugContentScript() {
  const debugger = new ContentScriptDebugger();

  // 1. Test injection
  const injection = await debugger.testContentScriptInjection();
  if (!injection.success) {
    console.error('Content Script Injection Failed:', injection.error);
    return;
  }

  // 2. Test DOM access
  await debugger.validateDOMAccess();

  // 3. Test content extraction
  await debugger.testContentExtraction();

  // 4. Test user interactions
  await debugger.testUserInteractions();

  // 5. Generate context-specific report
  const report = await debugger.generateContextReport();
  console.log('Content Script Debug Report:', report);
}
```

### Integration Debugging Pattern

```typescript
async function debugIntegration() {
  const debugger = new IntegrationDebugger();

  // 1. Test cross-context communication
  await debugger.testCrossContextCommunication();

  // 2. Test data flow
  await debugger.testDataFlow();

  // 3. Test error propagation
  await debugger.testErrorPropagation();

  // 4. Test performance bottlenecks
  await debugger.testPerformanceBottlenecks();

  // 5. Generate integration report
  const report = await debugger.generateIntegrationReport();
  console.log('Integration Debug Report:', report);
}
```

## 📊 Performance Debugging Workflow

### Memory Analysis Workflow

```typescript
async function analyzeMemoryUsage() {
  const memoryMonitor = new MemoryMonitor();

  // 1. Start monitoring
  await memoryMonitor.startMonitoring();

  // 2. Collect baseline
  const baseline = await memoryMonitor.captureMemorySnapshot();

  // 3. Perform operations
  // ... execute extension operations ...

  // 4. Collect post-operation snapshot
  const postOperation = await memoryMonitor.captureMemorySnapshot();

  // 5. Analyze memory usage
  const analysis = memoryMonitor.analyzeMemoryUsage(baseline, postOperation);

  // 6. Generate recommendations
  const recommendations = memoryMonitor.generateMemoryRecommendations(analysis);

  console.log('Memory Analysis:', analysis);
  console.log('Recommendations:', recommendations);
}
```

### Performance Optimization Workflow

```typescript
async function optimizePerformance() {
  const optimizationSystem = new PerformanceOptimizationSystem();

  // 1. Initialize optimization system
  await optimizationSystem.initialize();

  // 2. Analyze current performance
  const sessionState = debugSession.getCurrentSession();
  const recommendations =
    optimizationSystem.getOptimizationRecommendations(sessionState);

  // 3. Execute optimization plans
  if (
    recommendations.priority === 'critical' ||
    recommendations.priority === 'high'
  ) {
    const result = await optimizationSystem.executeOptimizationPlan(
      'memory-optimization',
      sessionState
    );
    console.log('Optimization Result:', result);
  }

  // 4. Generate optimization report
  const report = optimizationSystem.generateOptimizationReport();
  console.log('Optimization Report:', report);
}
```

## 🚨 Error Handling and Recovery

### Error Investigation Workflow

```typescript
async function investigateError(error) {
  const errorTracker = new ErrorPropagationTracker();

  // 1. Capture error context
  const errorContext = await errorTracker.captureErrorContext(error);

  // 2. Trace error propagation
  const propagationPath = await errorTracker.traceErrorPropagation(error);

  // 3. Identify root cause
  const rootCause = await errorTracker.identifyRootCause(
    error,
    propagationPath
  );

  // 4. Generate recovery recommendations
  const recovery =
    await errorTracker.generateRecoveryRecommendations(rootCause);

  console.log('Error Investigation Results:', {
    context: errorContext,
    propagation: propagationPath,
    rootCause: rootCause,
    recovery: recovery,
  });
}
```

### Automated Recovery Workflow

```typescript
async function attemptAutomatedRecovery(error) {
  const recoverySystem = new AutomatedRecoverySystem();

  // 1. Classify error
  const classification = await recoverySystem.classifyError(error);

  // 2. Apply recovery strategy
  const recoveryResult =
    await recoverySystem.applyRecoveryStrategy(classification);

  // 3. Validate recovery
  const validation = await recoverySystem.validateRecovery();

  // 4. Log recovery attempt
  console.log('Recovery Attempt:', {
    classification: classification,
    result: recoveryResult,
    validation: validation,
  });

  return validation.success;
}
```

## 📋 Debugging Checklist

### Pre-Debugging Checklist

- [ ] Chrome DevTools MCP server is running and accessible
- [ ] Extension is loaded in Chrome developer mode
- [ ] Debug environment is properly initialized
- [ ] Required permissions are granted
- [ ] Test data and scenarios are prepared

### During Debugging Checklist

- [ ] Debug session is active and capturing data
- [ ] Appropriate context debuggers are selected
- [ ] Test scenarios are executed systematically
- [ ] Performance metrics are being monitored
- [ ] Error logs are being captured and analyzed

### Post-Debugging Checklist

- [ ] Debug session is properly closed
- [ ] Reports are generated and saved
- [ ] Findings are documented
- [ ] Recommendations are prioritized
- [ ] Recovery actions are planned
- [ ] Continuous monitoring is configured (if needed)

## 🎯 Best Practices for LLM Debugging

1. **Start Systematically**: Always begin with the comprehensive health check before diving into specific issues
2. **Use Appropriate Context**: Select the right context debugger based on the issue symptoms
3. **Capture Comprehensive Data**: Enable all data capture options during debugging sessions
4. **Generate Reports**: Always generate and analyze reports for systematic findings
5. **Monitor Performance**: Include performance analysis in every debugging session
6. **Document Findings**: Use the reporting system to document all findings and recommendations
7. **Test Recovery**: Always validate that fixes resolve the original issue
8. **Set Up Monitoring**: Configure continuous monitoring for critical issues

This workflow guide provides systematic approaches for LLMs to debug the Chrome Extension effectively using the comprehensive debugging infrastructure.
