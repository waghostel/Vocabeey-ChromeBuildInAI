/**
 * Validation script for LLM documentation completeness and accuracy
 */

console.log('🚀 Validating LLM Documentation Suite...\n');

const fs = require('fs');
const path = require('path');

// Required LLM documentation files
const requiredLLMDocs = [
  'LLM_COMPREHENSIVE_GUIDE_INDEX.md',
  'LLM_QUICK_REFERENCE_GUIDE.md',
  'LLM_EXTENSION_ARCHITECTURE_GUIDE.md',
  'LLM_CHROME_EXTENSION_EXAMINATION_GUIDE.md',
  'LLM_DEBUGGING_WORKFLOW_GUIDE.md'
];

// Core documentation files that should be referenced
const coreDocFiles = [
  'README.md',
  'DEBUGGING_WORKFLOW.md',
  'TROUBLESHOOTING_GUIDE.md',
  'DEBUGGING_BEST_PRACTICES.md',
  'MCP_DEBUGGING_COMMANDS_CHEATSHEET.md',
  'LLM_ERROR_FIXING_GUIDE.md'
];

// Implementation summaries
const implementationSummaries = [
  'SERVICE_WORKER_DEBUGGING_SUMMARY.md',
  'UI_COMPONENT_DEBUGGING_SUMMARY.md',
  'STORAGE_CACHING_DEBUGGING_SUMMARY.md',
  'CROSS_COMPONENT_INTEGRATION_DEBUGGING_SUMMARY.md'
];

console.log('1. Checking LLM documentation files...');

let allLLMDocsExist = true;
for (const doc of requiredLLMDocs) {
  const filePath = path.join(__dirname, doc);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${doc} exists`);
  } else {
    console.log(`   ✗ ${doc} missing`);
    allLLMDocsExist = false;
  }
}

console.log('\n2. Checking core documentation files...');

let allCoreDocsExist = true;
for (const doc of coreDocFiles) {
  const filePath = path.join(__dirname, doc);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${doc} exists`);
  } else {
    console.log(`   ✗ ${doc} missing`);
    allCoreDocsExist = false;
  }
}

console.log('\n3. Checking implementation summaries...');

let allSummariesExist = true;
for (const doc of implementationSummaries) {
  const filePath = path.join(__dirname, doc);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${doc} exists`);
  } else {
    console.log(`   ✗ ${doc} missing`);
    allSummariesExist = false;
  }
}

console.log('\n4. Validating content structure...');

const validateDocumentStructure = (filePath, expectedSections) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    let allSectionsFound = true;
    
    for (const section of expectedSections) {
      if (content.includes(section)) {
        console.log(`   ✓ ${section} found in ${filePath}`);
      } else {
        console.log(`   ✗ ${section} missing in ${filePath}`);
        allSectionsFound = false;
      }
    }
    return allSectionsFound;
  } catch (error) {
    console.log(`   ✗ Error reading ${filePath}: ${error.message}`);
    return false;
  }
};

// Validate LLM Comprehensive Guide Index structure
const indexStructureValid = validateDocumentStructure('LLM_COMPREHENSIVE_GUIDE_INDEX.md', [
  '## 📖 Documentation Overview',
  '## 🚀 Getting Started Path',
  '## 🔍 Use Case Navigation',
  '## 📊 Documentation Matrix',
  '## 🎯 Context-Specific Guides'
]);

// Validate Quick Reference Guide structure
const quickRefStructureValid = validateDocumentStructure('LLM_QUICK_REFERENCE_GUIDE.md', [
  '## 🚀 Quick Start Commands',
  '## 🔍 Context-Specific Debugging',
  '## 📊 Performance Analysis',
  '## 🏗️ Architecture Quick Reference',
  '## 🚨 Common Issues & Quick Fixes'
]);

// Validate Architecture Guide structure
const archStructureValid = validateDocumentStructure('LLM_EXTENSION_ARCHITECTURE_GUIDE.md', [
  '## 🏗️ High-Level Architecture',
  '## 🔧 Component Architecture',
  '## 📊 Data Flow Architecture',
  '## 🗄️ Storage Architecture',
  '## 🚀 Performance Architecture'
]);

// Validate Examination Guide structure
const examStructureValid = validateDocumentStructure('LLM_CHROME_EXTENSION_EXAMINATION_GUIDE.md', [
  '## 🎯 Extension Overview',
  '## 📁 Project Structure Analysis',
  '## 🔍 Examination Methodology',
  '## 🛠 Common Examination Scenarios',
  '## 📊 Performance Analysis'
]);

// Validate Debugging Workflow Guide structure
const workflowStructureValid = validateDocumentStructure('LLM_DEBUGGING_WORKFLOW_GUIDE.md', [
  '## 🚀 Quick Start Debugging Workflow',
  '## 🔍 Systematic Issue Investigation',
  '## 🔄 Automated Debugging Workflows',
  '## 🎯 Context-Specific Debugging Patterns',
  '## 📊 Performance Debugging Workflow'
]);

console.log('\n5. Checking cross-references...');

const checkCrossReferences = (filePath, expectedReferences) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    let allReferencesFound = true;
    
    for (const ref of expectedReferences) {
      if (content.includes(ref)) {
        console.log(`   ✓ Reference to ${ref} found in ${filePath}`);
      } else {
        console.log(`   ✗ Reference to ${ref} missing in ${filePath}`);
        allReferencesFound = false;
      }
    }
    return allReferencesFound;
  } catch (error) {
    console.log(`   ✗ Error checking references in ${filePath}: ${error.message}`);
    return false;
  }
};

// Check that the index properly references all guides
const indexReferencesValid = checkCrossReferences('LLM_COMPREHENSIVE_GUIDE_INDEX.md', [
  'LLM_QUICK_REFERENCE_GUIDE.md',
  'LLM_EXTENSION_ARCHITECTURE_GUIDE.md',
  'LLM_CHROME_EXTENSION_EXAMINATION_GUIDE.md',
  'LLM_DEBUGGING_WORKFLOW_GUIDE.md'
]);

// Check that README references the new LLM guides
const readmeReferencesValid = checkCrossReferences('README.md', [
  'LLM_COMPREHENSIVE_GUIDE_INDEX.md',
  'LLM_QUICK_REFERENCE_GUIDE.md'
]);

console.log('\n6. Validating code examples...');

const validateCodeExamples = (filePath, expectedCodePatterns) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    let allPatternsFound = true;
    
    for (const pattern of expectedCodePatterns) {
      if (content.includes(pattern)) {
        console.log(`   ✓ Code pattern "${pattern}" found in ${filePath}`);
      } else {
        console.log(`   ✗ Code pattern "${pattern}" missing in ${filePath}`);
        allPatternsFound = false;
      }
    }
    return allPatternsFound;
  } catch (error) {
    console.log(`   ✗ Error validating code in ${filePath}: ${error.message}`);
    return false;
  }
};

// Validate that guides contain proper code examples
const quickRefCodeValid = validateCodeExamples('LLM_QUICK_REFERENCE_GUIDE.md', [
  'new DebugSessionManager()',
  'new ServiceWorkerDebugger()',
  'new ContentScriptDebugger()',
  'new OffscreenDebugger()'
]);

const workflowCodeValid = validateCodeExamples('LLM_DEBUGGING_WORKFLOW_GUIDE.md', [
  'initializeDebugSession',
  'executeScenario',
  'generateReport'
]);

console.log('\n7. Checking documentation completeness...');

// Check that all debugging contexts are covered
const debuggingContexts = [
  'Service Worker',
  'Content Script',
  'Offscreen Document',
  'UI Component',
  'Storage',
  'Integration'
];

let allContextsCovered = true;
for (const context of debuggingContexts) {
  const quickRefContent = fs.readFileSync(path.join(__dirname, 'LLM_QUICK_REFERENCE_GUIDE.md'), 'utf8');
  if (quickRefContent.includes(context)) {
    console.log(`   ✓ ${context} debugging covered`);
  } else {
    console.log(`   ✗ ${context} debugging not covered`);
    allContextsCovered = false;
  }
}

console.log('\n📊 Validation Results:');
console.log(`   LLM Documentation Files: ${allLLMDocsExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Core Documentation Files: ${allCoreDocsExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Implementation Summaries: ${allSummariesExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Document Structure: ${indexStructureValid && quickRefStructureValid && archStructureValid && examStructureValid && workflowStructureValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Cross References: ${indexReferencesValid && readmeReferencesValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Code Examples: ${quickRefCodeValid && workflowCodeValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Context Coverage: ${allContextsCovered ? '✅ PASS' : '❌ FAIL'}`);

const overallSuccess = allLLMDocsExist && allCoreDocsExist && allSummariesExist && 
                      indexStructureValid && quickRefStructureValid && archStructureValid && 
                      examStructureValid && workflowStructureValid && indexReferencesValid && 
                      readmeReferencesValid && quickRefCodeValid && workflowCodeValid && 
                      allContextsCovered;

if (overallSuccess) {
  console.log('\n✅ LLM Documentation Suite VALIDATED!');
  console.log('\n🎯 Documentation Suite Summary:');
  console.log('   • Comprehensive Guide Index: Master navigation for all LLM documentation');
  console.log('   • Quick Reference Guide: Essential commands and patterns for immediate use');
  console.log('   • Extension Architecture Guide: Complete system architecture and design overview');
  console.log('   • Chrome Extension Examination Guide: Detailed methodology for examining the extension');
  console.log('   • Debugging Workflow Guide: Step-by-step debugging procedures and patterns');
  console.log('   • Cross-referenced with all existing documentation');
  console.log('   • Complete coverage of all debugging contexts and scenarios');
  console.log('   • Validated code examples and command references');
  console.log('\n🚀 LLMs can now effectively examine and debug the Chrome Extension using these guides!');
} else {
  console.log('\n❌ LLM Documentation Suite INCOMPLETE!');
  console.log('Please review the failed validations above and ensure all documentation is complete.');
  process.exit(1);
}