# Migration Guide: From TIDD to SDD

This guide helps you transition from TIDD (Testable-Interface Driven Development) to SDD (Spec Driven Development) with MCP.

## What's Changing?

### TIDD Approach
```typescript
// Interface definition
interface PaymentProcessor {
  charge(userId: string, amount: number): PaymentResult
}

// Test file (test_payment.ts)
describe('PaymentProcessor', () => {
  it('should charge valid amount', async () => {
    const processor = new PaymentProcessorImpl();
    const result = await processor.charge('user123', 99.99);
    expect(result.status).toBe('success');
  });
  
  it('should reject negative amounts', async () => {
    const processor = new PaymentProcessorImpl();
    await expect(processor.charge('user123', -10)).rejects.toThrow();
  });
});
```

### SDD Approach
```json
// spec.json - MCP tool specification
{
  "name": "charge",
  "description": "Process a payment charge",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": {
        "type": "string",
        "format": "uuid",
        "description": "User ID"
      },
      "amount": {
        "type": "number",
        "minimum": 0.01,
        "maximum": 1000000,
        "description": "Amount in USD"
      }
    },
    "required": ["userId", "amount"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["success", "failed"]
      },
      "transactionId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["status", "transactionId"]
  }
}
```

```javascript
// test.js - Implementation-agnostic tests
const tests = {
  async test_valid_charge({ charge }) {
    const result = await charge({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 99.99
    });
    assert(result.status === 'success');
    assert(isUUID(result.transactionId));
  },
  
  async test_rejects_negative({ charge }) {
    await assert.rejects(
      () => charge({ userId: 'valid-uuid', amount: -10 }),
      /minimum/
    );
  }
};
```

## Key Differences

| Aspect | TIDD | SDD |
|--------|------|-----|
| **Contract Format** | Language-specific interfaces | MCP JSON Schema |
| **Validation** | Manual in tests | Automatic from schema |
| **Tests Coupled To** | Language/framework | Specification only |
| **AI Consumption** | Limited | Direct - LLMs read JSON |
| **Cross-Language** | Requires translation | Same spec, any language |
| **Test Generation** | Manual | Can be automated from spec |

## Step-by-Step Migration

### Step 1: Extract Formal Specification

From your TIDD interface:
```typescript
interface PaymentProcessor {
  charge(userId: string, amount: number): PaymentResult
}
```

Create MCP specification:
```json
{
  "name": "charge",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string", "format": "uuid" },
      "amount": { "type": "number", "minimum": 0.01 }
    },
    "required": ["userId", "amount"]
  }
}
```

### Step 2: Add Behavior Constraints

TIDD had implicit constraints in test code. Make them explicit in the spec:

```json
{
  "inputSchema": {
    "properties": {
      "amount": {
        "type": "number",
        "minimum": 0.01,
        "maximum": 1000000,
        "description": "Amount in USD, must be positive"
      }
    }
  }
}
```

### Step 3: Convert Tests to Contract Validators

**Before (TIDD):**
```typescript
it('should reject negative amounts', async () => {
  const processor = new PaymentProcessorImpl();
  await expect(processor.charge('user123', -10)).rejects.toThrow();
});
```

**After (SDD):**
```javascript
async test_rejects_negative({ charge }) {
  // Test any implementation that provides 'charge'
  await assert.rejects(
    () => charge({ userId: 'valid-uuid', amount: -10 }),
    /minimum|amount/
  );
}
```

The key difference: SDD tests receive the implementation as a parameter, making them reusable across implementations.

### Step 4: Add Schema Validation to Implementation

```javascript
const Ajv = require('ajv');
const spec = require('./spec.json');

const ajv = new Ajv();
const validate = ajv.compile(spec.inputSchema);

function charge(params) {
  // Automatic validation from spec
  if (!validate(params)) {
    throw new Error(ajv.errorsText(validate.errors));
  }
  
  // Implementation logic
  // ...
}
```

### Step 5: Run Tests Against Multiple Implementations

```javascript
// test-runner.js
async function testImplementation(impl, name) {
  console.log(`Testing: ${name}`);
  for (const [testName, testFunc] of Object.entries(tests)) {
    await testFunc(impl);
    console.log(`  ✓ ${testName}`);
  }
}

// Test original implementation
await testImplementation(originalImpl, "Original");

// Test AI-generated implementation
await testImplementation(aiGeneratedImpl, "AI Generated");

// Test refactored implementation
await testImplementation(refactoredImpl, "Refactored");
```

## Real-World Example

### TIDD Codebase Structure
```
src/
  payment/
    PaymentProcessor.ts       # Interface
    PaymentProcessorImpl.ts   # Implementation
tests/
  payment/
    payment.test.ts           # Tests coupled to TypeScript
```

### SDD Codebase Structure
```
specs/
  payment/
    charge.spec.json          # MCP specification
    charge.tests.js           # Contract tests
src/
  payment/
    impl-stripe.js            # Stripe implementation
    impl-paypal.js            # PayPal implementation
    impl-mock.js              # Mock for testing
```

All three implementations (Stripe, PayPal, Mock) pass the same contract tests.

## Benefits After Migration

### 1. **AI Can Generate New Implementations**
```bash
# Give LLM the spec + tests
$ cat specs/payment/charge.spec.json specs/payment/charge.tests.js | llm generate-implementation --language rust

# LLM generates Rust implementation that passes tests
```

### 2. **Cross-Language Consistency**
```javascript
// Node.js implementation
const nodeImpl = require('./impl-node.js');
await runTests(nodeImpl); // ✓ Passes

// Python implementation (via bridge)
const pythonImpl = require('./impl-python-bridge.js');
await runTests(pythonImpl); // ✓ Passes same tests
```

### 3. **Automatic Validation**
```javascript
// Input validation is automatic from schema
const validate = ajv.compile(spec.inputSchema);
// No manual validation code needed
```

### 4. **Documentation IS the Spec**
```json
{
  "name": "charge",
  "description": "Process a payment charge for a user",
  "inputSchema": {
    "properties": {
      "amount": {
        "type": "number",
        "minimum": 0.01,
        "description": "Amount in USD, minimum $0.01"
      }
    }
  }
}
```
The spec is self-documenting and always accurate.

## Migration Checklist

- [ ] Identify modules to migrate (start with 1-2)
- [ ] Extract interface definitions to MCP JSON Schema
- [ ] Document constraints explicitly in schema
- [ ] Convert tests to implementation-agnostic format
- [ ] Add schema validation to implementations
- [ ] Run tests against existing implementations
- [ ] Verify AI can understand the spec
- [ ] Try generating new implementation via LLM
- [ ] Expand to more modules

## Common Pitfalls

### 1. **Making Tests Implementation-Specific**
❌ Bad (still coupled):
```javascript
test('uses correct database query', () => {
  expect(impl.query).toHaveBeenCalledWith('SELECT ...');
});
```

✅ Good (tests contract):
```javascript
test('returns user data', async () => {
  const result = await impl.getUser({ id: 'user123' });
  assert(result.id === 'user123');
  assert(typeof result.name === 'string');
});
```

### 2. **Incomplete Specifications**
❌ Bad (vague):
```json
{
  "properties": {
    "amount": { "type": "number" }
  }
}
```

✅ Good (explicit):
```json
{
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0.01,
      "maximum": 1000000,
      "multipleOf": 0.01,
      "description": "Amount in USD, positive, max $1M"
    }
  }
}
```

### 3. **Forgetting to Version Specs**
Always version your specifications:
```json
{
  "name": "charge",
  "version": "2.0.0",
  "inputSchema": { ... }
}
```

## Success Metrics

You've successfully migrated when:

✓ Tests run against multiple implementations  
✓ New implementations can be added without changing tests  
✓ LLMs can read specs and generate valid implementations  
✓ Validation happens automatically from schemas  
✓ Documentation is always in sync (because it IS the spec)  

## Next Steps

1. Start with one module/service
2. Create MCP specification
3. Write contract tests
4. Validate existing implementation
5. Try AI-generating an alternative implementation
6. Expand to more modules

---

**Remember:** SDD doesn't replace TIDD, it evolves it. The core principles (testable contracts, interface-first) remain the same, but the format becomes AI-native and machine-executable.
