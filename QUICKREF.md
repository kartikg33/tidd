# SDD Quick Reference

## Core Concept

**Spec Driven Development (SDD)** = Formal specifications + AI-native contracts + Automatic validation

## The SDD Cycle

```
1. Write Spec (MCP JSON Schema)
   ↓
2. Define Behaviors (Test cases)
   ↓
3. Implement (Human or AI)
   ↓
4. Validate (Automatic)
   ↓
5. Iterate
```

## Essential Components

### 1. The Specification (MCP Format)

```json
{
  "name": "tool_name",
  "version": "1.0.0",
  "description": "What it does",
  "inputSchema": {
    "type": "object",
    "properties": {
      "param": {
        "type": "string",
        "pattern": "^[A-Z]+$",
        "description": "Uppercase letters only"
      }
    },
    "required": ["param"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    }
  }
}
```

### 2. Contract Tests

```javascript
const tests = {
  async test_valid_input({ tool_name }) {
    const result = await tool_name({ param: "ABC" });
    assert(result.result !== undefined);
  },
  
  async test_invalid_input({ tool_name }) {
    await assert.rejects(
      () => tool_name({ param: "abc" }), // lowercase invalid
      /pattern/
    );
  }
};
```

### 3. Implementation with Validation

```javascript
const Ajv = require('ajv');
const spec = require('./spec.json');
const validate = new Ajv().compile(spec.inputSchema);

function tool_name(params) {
  if (!validate(params)) {
    throw new Error(validate.errors);
  }
  // Implementation
  return { result: "..." };
}
```

### 4. Test Runner

```javascript
async function runTests(implementation) {
  for (const [name, test] of Object.entries(tests)) {
    await test(implementation);
    console.log(`✓ ${name}`);
  }
}

runTests({ tool_name });
```

## Why MCP?

| Feature | Benefit |
|---------|---------|
| JSON Schema | Automatic validation |
| Structured format | LLMs understand natively |
| Type definitions | Catches errors early |
| Constraints | Enforceable rules |
| Version control | Track API evolution |

## AI Prompt Template

```
Given this MCP tool specification:

[paste spec.json]

And these required behaviors:

[paste or describe test cases]

Generate a [language] implementation that:
1. Validates inputs using the schema
2. Satisfies all test cases
3. Handles errors appropriately
4. Returns output matching the schema
```

## File Structure

```
project/
├── specs/
│   └── my-tool/
│       ├── spec.json              # MCP specification
│       ├── tests.js               # Contract tests
│       └── README.md              # Documentation
├── implementations/
│   ├── impl-node.js               # Node.js impl
│   ├── impl-python.py             # Python impl
│   └── impl-rust.rs               # Rust impl
└── test-runner.js                 # Runs tests on all impls
```

## Common JSON Schema Patterns

### String with Pattern
```json
{
  "type": "string",
  "pattern": "^[A-Za-z0-9]+$",
  "minLength": 1,
  "maxLength": 100
}
```

### Number with Range
```json
{
  "type": "number",
  "minimum": 0,
  "maximum": 100,
  "multipleOf": 0.01
}
```

### Enum
```json
{
  "type": "string",
  "enum": ["active", "inactive", "pending"]
}
```

### Array with Items
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" }
    }
  },
  "minItems": 1,
  "maxItems": 10
}
```

### Object with Nested Properties
```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "email": { "type": "string", "format": "email" }
      },
      "required": ["id", "email"]
    }
  }
}
```

### Optional vs Required
```json
{
  "type": "object",
  "properties": {
    "required_field": { "type": "string" },
    "optional_field": { "type": "string" }
  },
  "required": ["required_field"],
  "additionalProperties": false
}
```

## Validation with AJV (JavaScript)

```javascript
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv); // Adds format validators (email, uuid, etc.)

const validate = ajv.compile(schema);

function validateInput(data) {
  const valid = validate(data);
  if (!valid) {
    throw new Error(ajv.errorsText(validate.errors));
  }
  return data;
}
```

## Testing Pattern

```javascript
// test-suite.js
module.exports = {
  async test_scenario_1({ tool }) {
    const result = await tool({ input: "value" });
    assert(result.expected === true);
  },
  
  async test_scenario_2({ tool }) {
    await assert.rejects(() => tool({ bad: "input" }));
  }
};

// run-tests.js
const tests = require('./test-suite');

async function runTests(implementation) {
  for (const [name, fn] of Object.entries(tests)) {
    try {
      await fn(implementation);
      console.log(`✓ ${name}`);
    } catch (err) {
      console.log(`✗ ${name}: ${err.message}`);
    }
  }
}
```

## Versioning Strategy

### Semantic Versioning for Specs

- **Major (2.0.0)**: Breaking changes (remove fields, change types)
- **Minor (1.1.0)**: Add optional fields, new features
- **Patch (1.0.1)**: Fix descriptions, add examples

```json
{
  "name": "my_tool",
  "version": "2.0.0",
  "changelog": {
    "2.0.0": "Removed deprecated 'oldField', added 'newField'",
    "1.1.0": "Added optional 'extraField'",
    "1.0.0": "Initial release"
  }
}
```

## Best Practices

### ✓ DO

- Write spec before implementation
- Use JSON Schema validation
- Make tests implementation-agnostic
- Version your specifications
- Add clear descriptions to all fields
- Include examples in documentation
- Test multiple implementations against same spec

### ✗ DON'T

- Test implementation details
- Skip validation
- Make assumptions not in the spec
- Change specs without version bumps
- Write language-specific tests
- Forget to document constraints
- Couple tests to specific implementations

## Debugging

### Schema Validation Errors

```javascript
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, verbose: true });

const validate = ajv.compile(schema);
if (!validate(data)) {
  console.log(JSON.stringify(validate.errors, null, 2));
}
```

### Test Failures

```javascript
async function runTestsVerbose(impl) {
  for (const [name, fn] of Object.entries(tests)) {
    try {
      await fn(impl);
      console.log(`✓ ${name}`);
    } catch (err) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${err.message}`);
      console.log(`  Stack: ${err.stack}`);
    }
  }
}
```

## Resources

- **MCP Specification**: https://modelcontextprotocol.io
- **JSON Schema**: https://json-schema.org
- **AJV Validator**: https://ajv.js.org
- **Examples**: See `examples/` directory

## Quick Start Checklist

- [ ] Install AJV: `npm install ajv ajv-formats`
- [ ] Create `spec.json` with MCP schema
- [ ] Write contract tests in `tests.js`
- [ ] Implement tool with validation
- [ ] Run tests: `node test.js`
- [ ] Try AI generation with spec as prompt
- [ ] Add more implementations as needed

---

**Remember**: The spec is the source of truth. Everything else (tests, implementations, docs) derives from it.
