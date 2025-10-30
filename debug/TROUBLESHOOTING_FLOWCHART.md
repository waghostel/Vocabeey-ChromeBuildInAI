# Playwright Debugging Troubleshooting Flowchart

## Visual Troubleshooting Guide

This document provides visual flowcharts and decision trees for debugging the Language Learning Chrome Extension using Playwright MCP.

## Main Troubleshooting Flow

```mermaid
flowchart TD
    Start([Issue Detected]) --> Build[Run: pnpm build]
    Build --> Validate[Run: Extension Validation]
    Validate --> LoadCheck{Extension<br/>Loads?}

    LoadCheck -->|No| LoadIssues[Loading Issues]
    LoadCheck -->|Yes| ContentCheck{Content Script<br/>Injects?}

    LoadIssues --> CheckManifest[Check manifest.json]
    CheckManifest --> CheckPaths[Verify file paths]
    CheckPaths --> FixPaths[Fix paths/imports]
    FixPaths --> Rebuild1[Rebuild]
    Rebuild1 --> Validate

    ContentCheck -->|No| ContentIssues[Content Script Issues]
    ContentCheck -->|Yes| ProcessCheck{Processing<br/>Works?}

    ContentIssues --> TestContent[Run: Content Script Test]
    TestContent --> CheckCSP[Check CSP violations]
    CheckCSP --> CheckMatches[Verify match patterns]
    CheckMatches --> FixContent[Fix injection issues]
    FixContent --> Rebuild2[Rebuild]
    Rebuild2 --> Validate

    ProcessCheck -->|No| ProcessIssues[Processing Issues]
    ProcessCheck -->|Yes| UICheck{UI<br/>Renders?}

    ProcessIssues --> TestWorkflow[Run: Workflow Test]
    TestWorkflow --> CheckAI[Check AI services]
    CheckAI --> CheckOffscreen[Verify offscreen doc]
    CheckOffscreen --> FixProcess[Fix processing]
    FixProcess --> Rebuild3[Rebuild]
    Rebuild3 --> Validate

    UICheck -->|No| UIIssues[UI Issues]
    UICheck -->|Yes| PerfCheck{Performance<br/>OK?}

    UIIssues --> TestUI[Run: UI Test]
    TestUI --> CheckConsole[Check console errors]
    CheckConsole --> CheckDOM[Verify DOM ready]
    CheckDOM --> FixUI[Fix UI issues]
    FixUI --> Rebuild4[Rebuild]
    Rebuild4 --> Validate

    PerfCheck -->|No| PerfIssues[Performance Issues]
    PerfCheck -->|Yes| Success([✓ All Working])

    PerfIssues --> TestPerf[Run: Performance Test]
    TestPerf --> Optimize[Optimize bottlenecks]
    Optimize --> Rebuild5[Rebuild]
    Rebuild5 --> Validate
```

## Extension Loading Troubleshooting

```mermaid
flowchart TD
    Start([Extension Won't Load]) --> RunVal[Run Extension Validation]
    RunVal --> CheckReport[Check validation report]
    CheckReport --> ErrorType{Error Type?}

    ErrorType -->|Manifest Error| ManifestFlow[Manifest Issues]
    ErrorType -->|Path Error| PathFlow[Path Issues]
    ErrorType -->|Import Error| ImportFlow[Import Issues]
    ErrorType -->|Other| OtherFlow[Other Issues]

    ManifestFlow --> ValidateManifest[Validate manifest.json syntax]
    ValidateManifest --> CheckVersion[Check manifest_version: 3]
    CheckVersion --> CheckPerms[Verify permissions]
    CheckPerms --> FixManifest[Fix manifest issues]
    FixManifest --> RebuildM[Rebuild & Test]

    PathFlow --> CheckDist[Verify dist/ structure]
    CheckDist --> CheckRefs[Check file references]
    CheckRefs --> ListFiles[List all referenced files]
    ListFiles --> VerifyExists[Verify files exist]
    VerifyExists --> FixPaths[Fix missing/incorrect paths]
    FixPaths --> RebuildP[Rebuild & Test]

    ImportFlow --> ScanImports[Scan import statements]
    ScanImports --> CheckExt[Check .js extensions]
    CheckExt --> CheckRelative[Verify relative paths]
    CheckRelative --> FixImports[Add .js extensions]
    FixImports --> RebuildI[Rebuild & Test]

    OtherFlow --> ReviewLogs[Review console logs]
    ReviewLogs --> SearchError[Search error message]
    SearchError --> ApplyFix[Apply specific fix]
    ApplyFix --> RebuildO[Rebuild & Test]

    RebuildM --> Success([✓ Extension Loads])
    RebuildP --> Success
    RebuildI --> Success
    RebuildO --> Success
```

## Content Script Injection Troubleshooting

```mermaid
flowchart TD
    Start([Content Script Not Injecting]) --> RunTest[Run Content Script Test]
    RunTest --> CheckResult{Injection<br/>Successful?}

    CheckResult -->|No| CheckManifest[Check manifest content_scripts]
    CheckResult -->|Yes on some pages| CSPIssue[CSP Issue]

    CheckManifest --> VerifyMatches[Verify match patterns]
    VerifyMatches --> MatchesOK{Patterns<br/>Correct?}

    MatchesOK -->|No| FixMatches[Update match patterns]
    MatchesOK -->|Yes| CheckFile[Verify file path]

    FixMatches --> RebuildM[Rebuild & Test]

    CheckFile --> FileExists{File<br/>Exists?}
    FileExists -->|No| FixPath[Fix file path in manifest]
    FileExists -->|Yes| CheckRunAt[Check run_at timing]

    FixPath --> RebuildF[Rebuild & Test]

    CheckRunAt --> TimingOK{Timing<br/>Correct?}
    TimingOK -->|No| FixTiming[Adjust run_at setting]
    TimingOK -->|Yes| CheckCode[Check script code]

    FixTiming --> RebuildT[Rebuild & Test]

    CheckCode --> CodeErrors{Syntax<br/>Errors?}
    CodeErrors -->|Yes| FixCode[Fix code errors]
    CodeErrors -->|No| CheckPerms[Check permissions]

    FixCode --> RebuildC[Rebuild & Test]

    CheckPerms --> PermsOK{Permissions<br/>Sufficient?}
    PermsOK -->|No| AddPerms[Add required permissions]
    PermsOK -->|Yes| OtherIssue[Review detailed logs]

    AddPerms --> RebuildP[Rebuild & Test]

    CSPIssue --> CheckCSP[Check page CSP headers]
    CheckCSP --> StrictCSP{Strict<br/>CSP?}
    StrictCSP -->|Yes| TestOtherPages[Test on different pages]
    StrictCSP -->|No| CheckInjection[Check injection method]

    TestOtherPages --> DocumentIssue[Document CSP limitation]
    CheckInjection --> FixInjection[Adjust injection approach]
    FixInjection --> RebuildCSP[Rebuild & Test]

    RebuildM --> Success([✓ Injection Working])
    RebuildF --> Success
    RebuildT --> Success
    RebuildC --> Success
    RebuildP --> Success
    RebuildCSP --> Success
    DocumentIssue --> Success
    OtherIssue --> Success
```

## Article Processing Troubleshooting

```mermaid
flowchart TD
    Start([Processing Fails]) --> RunWorkflow[Run Workflow Test]
    RunWorkflow --> CheckStage{Which Stage<br/>Fails?}

    CheckStage -->|Extraction| ExtractionFlow[Content Extraction]
    CheckStage -->|AI Processing| AIFlow[AI Processing]
    CheckStage -->|Storage| StorageFlow[Storage]
    CheckStage -->|UI Display| UIFlow[UI Display]

    ExtractionFlow --> TestExtraction[Test content extraction]
    TestExtraction --> CheckContent{Content<br/>Extracted?}
    CheckContent -->|No| CheckPage[Verify page has content]
    CheckContent -->|Yes| CheckQuality[Check extraction quality]
    CheckPage --> TryDifferentPage[Test different article]
    CheckQuality --> QualityOK{Quality<br/>Good?}
    QualityOK -->|No| ImproveExtraction[Improve extraction logic]
    QualityOK -->|Yes| NextStage1[Continue to AI]

    AIFlow --> CheckAI[Check AI service availability]
    CheckAI --> AIAvailable{AI APIs<br/>Available?}
    AIAvailable -->|No| CheckFallback[Check Gemini fallback]
    AIAvailable -->|Yes| CheckOffscreen[Verify offscreen doc]
    CheckFallback --> FallbackWorks{Fallback<br/>Works?}
    FallbackWorks -->|No| ConfigureAPI[Configure API keys]
    FallbackWorks -->|Yes| NextStage2[Continue processing]
    CheckOffscreen --> OffscreenOK{Offscreen<br/>Loaded?}
    OffscreenOK -->|No| FixOffscreen[Fix offscreen document]
    OffscreenOK -->|Yes| CheckMessages[Check message passing]
    CheckMessages --> MessagesOK{Messages<br/>Working?}
    MessagesOK -->|No| FixMessages[Fix message handlers]
    MessagesOK -->|Yes| NextStage3[Continue processing]

    StorageFlow --> CheckStorage[Check storage operations]
    CheckStorage --> StorageWorks{Storage<br/>Working?}
    StorageWorks -->|No| CheckQuota[Check storage quota]
    StorageWorks -->|Yes| NextStage4[Continue to UI]
    CheckQuota --> QuotaOK{Quota<br/>Available?}
    QuotaOK -->|No| ClearCache[Clear cache]
    QuotaOK -->|Yes| FixStorageCode[Fix storage code]

    UIFlow --> CheckUIRender[Check UI rendering]
    CheckUIRender --> UIRenders{UI<br/>Renders?}
    UIRenders -->|No| CheckUICode[Check UI code errors]
    UIRenders -->|Yes| CheckData[Verify data display]
    CheckUICode --> FixUICode[Fix UI errors]
    CheckData --> DataOK{Data<br/>Correct?}
    DataOK -->|No| FixDataFlow[Fix data flow]
    DataOK -->|Yes| Success([✓ Processing Works])

    TryDifferentPage --> Success
    ImproveExtraction --> Success
    NextStage1 --> Success
    ConfigureAPI --> Success
    NextStage2 --> Success
    FixOffscreen --> Success
    FixMessages --> Success
    NextStage3 --> Success
    NextStage4 --> Success
    ClearCache --> Success
    FixStorageCode --> Success
    FixUICode --> Success
    FixDataFlow --> Success
```

## Performance Optimization Flow

```mermaid
flowchart TD
    Start([Performance Issues]) --> RunPerf[Run Performance Test]
    RunPerf --> AnalyzeMetrics[Analyze metrics]
    AnalyzeMetrics --> Bottleneck{Identify<br/>Bottleneck}

    Bottleneck -->|Page Load| PageLoadFlow[Page Load Optimization]
    Bottleneck -->|AI Processing| AIFlow[AI Optimization]
    Bottleneck -->|Memory| MemoryFlow[Memory Optimization]
    Bottleneck -->|Network| NetworkFlow[Network Optimization]

    PageLoadFlow --> CheckInit[Check initialization time]
    CheckInit --> OptimizeInit[Optimize initialization]
    OptimizeInit --> LazyLoad[Implement lazy loading]
    LazyLoad --> TestPageLoad[Test page load]
    TestPageLoad --> PageLoadOK{Improved?}
    PageLoadOK -->|Yes| Success1([✓ Optimized])
    PageLoadOK -->|No| ProfileDeeper1[Profile deeper]

    AIFlow --> CheckAITime[Check AI processing time]
    CheckAITime --> Sequential{Sequential<br/>Processing?}
    Sequential -->|Yes| Parallelize[Implement parallel processing]
    Sequential -->|No| CheckBatch[Check batch sizes]
    Parallelize --> TestAI1[Test AI performance]
    CheckBatch --> OptimizeBatch[Optimize batch sizes]
    OptimizeBatch --> TestAI2[Test AI performance]
    TestAI1 --> AIOK{Improved?}
    TestAI2 --> AIOK
    AIOK -->|Yes| AddCaching[Add caching]
    AIOK -->|No| ProfileDeeper2[Profile deeper]
    AddCaching --> Success2([✓ Optimized])

    MemoryFlow --> CheckUsage[Check memory usage]
    CheckUsage --> HighUsage{Usage<br/>High?}
    HighUsage -->|Yes| FindLeaks[Find memory leaks]
    HighUsage -->|No| CheckGrowth[Check memory growth]
    FindLeaks --> FixLeaks[Fix memory leaks]
    FixLeaks --> TestMemory1[Test memory]
    CheckGrowth --> OptimizeData[Optimize data structures]
    OptimizeData --> TestMemory2[Test memory]
    TestMemory1 --> MemoryOK{Improved?}
    TestMemory2 --> MemoryOK
    MemoryOK -->|Yes| Success3([✓ Optimized])
    MemoryOK -->|No| ProfileDeeper3[Profile deeper]

    NetworkFlow --> CheckRequests[Check network requests]
    CheckRequests --> TooMany{Too Many<br/>Requests?}
    TooMany -->|Yes| BatchRequests[Batch requests]
    TooMany -->|No| CheckSlow[Check slow requests]
    BatchRequests --> TestNetwork1[Test network]
    CheckSlow --> OptimizeAPI[Optimize API calls]
    OptimizeAPI --> AddCache[Add response caching]
    AddCache --> TestNetwork2[Test network]
    TestNetwork1 --> NetworkOK{Improved?}
    TestNetwork2 --> NetworkOK
    NetworkOK -->|Yes| Success4([✓ Optimized])
    NetworkOK -->|No| ProfileDeeper4[Profile deeper]

    ProfileDeeper1 --> DetailedProfile[Use Chrome DevTools]
    ProfileDeeper2 --> DetailedProfile
    ProfileDeeper3 --> DetailedProfile
    ProfileDeeper4 --> DetailedProfile
    DetailedProfile --> ApplyFix[Apply specific fixes]
    ApplyFix --> Retest[Retest performance]
    Retest --> Success5([✓ Optimized])
```

## Error Message Decision Tree

```mermaid
flowchart TD
    Start([Error Detected]) --> ErrorType{Error Type?}

    ErrorType -->|Module Resolution| ModuleError[Module Resolution Error]
    ErrorType -->|Loading| LoadError[Loading Error]
    ErrorType -->|Runtime| RuntimeError[Runtime Error]
    ErrorType -->|Network| NetworkError[Network Error]
    ErrorType -->|Storage| StorageError[Storage Error]

    ModuleError --> CheckExtension[Check .js extension]
    CheckExtension --> HasExtension{Has .js?}
    HasExtension -->|No| AddExtension[Add .js extension]
    HasExtension -->|Yes| CheckPath[Check relative path]
    AddExtension --> Fix1([Fix Applied])
    CheckPath --> PathCorrect{Path<br/>Correct?}
    PathCorrect -->|No| FixPath[Fix relative path]
    PathCorrect -->|Yes| CheckFile[Verify file exists]
    FixPath --> Fix2([Fix Applied])
    CheckFile --> Fix3([Fix Applied])

    LoadError --> CheckManifest[Check manifest.json]
    CheckManifest --> ManifestValid{Valid<br/>JSON?}
    ManifestValid -->|No| FixJSON[Fix JSON syntax]
    ManifestValid -->|Yes| CheckPaths[Check file paths]
    FixJSON --> Fix4([Fix Applied])
    CheckPaths --> PathsExist{Files<br/>Exist?}
    PathsExist -->|No| CreateFiles[Create missing files]
    PathsExist -->|Yes| CheckPerms[Check permissions]
    CreateFiles --> Fix5([Fix Applied])
    CheckPerms --> Fix6([Fix Applied])

    RuntimeError --> CheckConsole[Check console logs]
    CheckConsole --> ErrorLocation{Error<br/>Location?}
    ErrorLocation -->|Known| FixCode[Fix code error]
    ErrorLocation -->|Unknown| AddLogging[Add debug logging]
    FixCode --> Fix7([Fix Applied])
    AddLogging --> Reproduce[Reproduce error]
    Reproduce --> Fix8([Fix Applied])

    NetworkError --> CheckEndpoint[Check API endpoint]
    CheckEndpoint --> EndpointOK{Endpoint<br/>Correct?}
    EndpointOK -->|No| FixEndpoint[Fix endpoint URL]
    EndpointOK -->|Yes| CheckCORS[Check CORS]
    FixEndpoint --> Fix9([Fix Applied])
    CheckCORS --> CORSOk{CORS<br/>OK?}
    CORSOk -->|No| ConfigureCORS[Configure CORS]
    CORSOk -->|Yes| CheckNetwork[Check network]
    ConfigureCORS --> Fix10([Fix Applied])
    CheckNetwork --> Fix11([Fix Applied])

    StorageError --> CheckQuota[Check storage quota]
    CheckQuota --> QuotaOK{Quota<br/>Available?}
    QuotaOK -->|No| ClearStorage[Clear old data]
    QuotaOK -->|Yes| CheckPerms2[Check permissions]
    ClearStorage --> Fix12([Fix Applied])
    CheckPerms2 --> PermsOK{Permissions<br/>OK?}
    PermsOK -->|No| AddStoragePerm[Add storage permission]
    PermsOK -->|Yes| CheckCode[Check storage code]
    AddStoragePerm --> Fix13([Fix Applied])
    CheckCode --> Fix14([Fix Applied])
```

## Quick Decision Guide

### When to Use Each Test

```mermaid
flowchart LR
    Start([Need to Test]) --> Question{What to Test?}

    Question -->|Basic Functionality| Validation[Extension Validation]
    Question -->|Content Injection| ContentTest[Content Script Test]
    Question -->|Full Workflow| WorkflowTest[Workflow Test]
    Question -->|User Interactions| UITest[UI Test]
    Question -->|Error Handling| ErrorTest[Error Test]
    Question -->|Performance| PerfTest[Performance Test]
    Question -->|Everything| CompTest[Comprehensive Test]

    Validation --> V[npx tsx debug/run-extension-validation.ts]
    ContentTest --> C[npx tsx debug/test-content-script-injection.ts]
    WorkflowTest --> W[npx tsx debug/test-article-processing-workflow.ts]
    UITest --> U[npx tsx debug/test-user-interaction.ts]
    ErrorTest --> E[npx tsx debug/test-error-handling-edge-cases.ts]
    PerfTest --> P[npx tsx debug/run-performance-monitoring.ts]
    CompTest --> R[npx tsx debug/run-comprehensive-report-generator.ts]
```

## Debugging Priority Matrix

| Issue Severity       | Impact   | Priority | Action              |
| -------------------- | -------- | -------- | ------------------- |
| Extension won't load | Critical | P0       | Fix immediately     |
| Module import errors | Critical | P0       | Fix immediately     |
| Content script fails | High     | P1       | Fix within 1 day    |
| Processing fails     | High     | P1       | Fix within 1 day    |
| UI not rendering     | High     | P1       | Fix within 1 day    |
| Performance issues   | Medium   | P2       | Fix within 1 week   |
| Minor UI glitches    | Low      | P3       | Fix when convenient |
| Documentation gaps   | Low      | P3       | Fix when convenient |

## Testing Frequency Recommendations

| Test Type            | Frequency      | Trigger                |
| -------------------- | -------------- | ---------------------- |
| Extension Validation | Every build    | After code changes     |
| Content Script Test  | Daily          | Content script changes |
| Workflow Test        | Daily          | Core logic changes     |
| UI Test              | As needed      | UI changes             |
| Error Test           | Weekly         | Error handling changes |
| Performance Test     | Weekly         | Performance concerns   |
| Comprehensive Test   | Before release | Release preparation    |

## Common Patterns

### Pattern 1: Build → Validate → Fix → Repeat

```
1. pnpm build
2. npx tsx debug/run-extension-validation.ts
3. Review report
4. Fix issues
5. Go to step 1
```

### Pattern 2: Specific Issue → Specific Test

```
Content script issue?
  → npx tsx debug/test-content-script-injection.ts

Processing issue?
  → npx tsx debug/test-article-processing-workflow.ts

UI issue?
  → npx tsx debug/test-user-interaction.ts

Performance issue?
  → npx tsx debug/run-performance-monitoring.ts
```

### Pattern 3: Unknown Issue → Comprehensive Test

```
Not sure what's wrong?
  → npx tsx debug/run-comprehensive-report-generator.ts
  → Review comprehensive report
  → Identify specific area
  → Run specific test
  → Fix issue
```

## Summary

Use these flowcharts to:

1. Quickly identify the right debugging approach
2. Follow systematic troubleshooting steps
3. Make informed decisions about fixes
4. Prioritize issues effectively
5. Choose appropriate tests

For detailed instructions, see [PLAYWRIGHT_DEBUGGING_GUIDE.md](./PLAYWRIGHT_DEBUGGING_GUIDE.md).
