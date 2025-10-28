# Design Document

## Overview

The system integration test failure is caused by a race condition in article ID generation. The test processes 50 articles rapidly, but uses `Date.now()` for ID generation, which can produce duplicate timestamps when operations occur within the same millisecond. This causes articles to overwrite each other in the storage object, resulting in fewer than 50 articles being stored.

## Root Cause Analysis

### Current Implementation Issue

```typescript
// In processArticleFromUrl method
id: `article-${Date.now()}`,
```

**Problem**: `Date.now()` returns millisecond precision. When processing articles rapidly (even with 1ms delays), multiple articles can receive identical timestamps, causing storage collisions.

**Evidence**: Test processes 50 articles but only 48 are stored, indicating 2 collisions occurred.

### Timing Analysis

- Test processes 50 articles with 1ms delays between iterations
- `Date.now()` has millisecond precision
- In fast execution environments, multiple calls within the same millisecond return identical values
- Articles with identical IDs overwrite each other in `systemState.articles[id]`

## Architecture

### Current Flow

```
processArticleFromUrl(url) →
  Generate ID: `article-${Date.now()}` →
  Store: systemState.articles[id] = article →
  Collision: Same ID overwrites previous article
```

### Proposed Solution Flow

```
processArticleFromUrl(url) →
  Generate Unique ID: `article-${Date.now()}-${counter}` →
  Store: systemState.articles[uniqueId] = article →
  No Collision: Each article gets unique storage key
```

## Components and Interfaces

### ID Generation Strategy

**Option 1: Counter-based Suffix (Recommended)**

```typescript
let articleCounter = 0;
id: `article-${Date.now()}-${++articleCounter}`;
```

**Benefits:**

- Minimal code change
- Guaranteed uniqueness within test execution
- Maintains timestamp-based ordering
- Fast execution

**Option 2: UUID Generation**

```typescript
id: `article-${crypto.randomUUID()}`;
```

**Benefits:**

- Globally unique
- No collision risk

**Drawbacks:**

- Requires crypto API availability
- Loses timestamp-based ordering
- More complex change

**Option 3: High-precision Timestamp**

```typescript
id: `article-${performance.now()}-${Math.random()}`;
```

**Benefits:**

- Higher precision than Date.now()
- Additional randomness

**Drawbacks:**

- Still potential for collisions
- More complex

### Implementation Approach

**Selected Solution: Counter-based Suffix**

1. Add a module-level counter variable
2. Increment counter for each article creation
3. Append counter to timestamp-based ID
4. Reset counter in test setup if needed

## Data Models

### Article ID Format

**Current:**

```
article-1698765432123
```

**New:**

```
article-1698765432123-1
article-1698765432123-2
article-1698765432123-3
```

### Storage Impact

No changes to storage structure - only ID generation logic changes. The `systemState.articles` object will continue to use string keys, but they will be guaranteed unique.

## Error Handling

### Collision Detection (Optional Enhancement)

```typescript
// Optional: Add collision detection for debugging
if (systemState.articles[id]) {
  console.warn(`Article ID collision detected: ${id}`);
}
```

### Counter Overflow Protection

```typescript
// Reset counter if it gets too large (unlikely in practice)
if (articleCounter > 999999) {
  articleCounter = 0;
}
```

## Testing Strategy

### Test Validation

1. **Immediate Fix Validation**
   - Run the failing test to verify it passes
   - Confirm exactly 50 articles are stored

2. **Regression Testing**
   - Run full system integration test suite
   - Verify no other tests are affected
   - Confirm performance requirements still met

3. **Edge Case Testing**
   - Test with even faster processing (no delays)
   - Test with larger datasets (100+ articles)
   - Verify counter resets work correctly

### Performance Impact

- Counter increment: O(1) operation
- String concatenation: Minimal overhead
- No impact on storage or retrieval performance
- Test execution time should remain similar

## Implementation Considerations

### Scope of Change

**Minimal Change Approach:**

- Only modify the ID generation line in the test
- No changes to production code (this is test-specific)
- No API contract changes

### Test Environment Specifics

The fix is specific to the test environment's `systemController` mock implementation. Production code may use different ID generation strategies that are already collision-resistant.

### Backward Compatibility

The change maintains backward compatibility:

- ID format remains string-based
- Storage operations unchanged
- Other test expectations unaffected

## Alternative Solutions Considered

### 1. Increase Delay Between Operations

**Rejected**: Would slow down test execution significantly and doesn't guarantee collision prevention.

### 2. Use URL-based IDs

**Rejected**: URLs in test are already unique, but this would be a larger architectural change.

### 3. Mock Date.now() to Return Unique Values

**Rejected**: Would affect other parts of the test that rely on realistic timing.

### 4. Use Atomic Counter Only

**Rejected**: Loses timestamp information which may be useful for debugging and ordering.
