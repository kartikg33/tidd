# MCP Calculate Total - SDD Example

This example demonstrates Spec Driven Development using an MCP tool specification.

## The Contract

See [`spec.json`](./spec.json) for the formal MCP specification.

**Tool**: `calculate_total`
- **Input**: price (required), taxRate (required), discount (optional)
- **Output**: total and detailed breakdown
- **Constraints**: All numbers must be non-negative, rates must be 0-1

## Test Suite

See [`test.js`](./test.js) for tests that validate the contract.

The tests are **implementation-agnostic** - they validate behavior, not code.

## Implementations

We provide two implementations that both satisfy the same contract:

1. **Simple Implementation** ([`implementation-simple.js`](./implementation-simple.js))
   - Minimal code, basic validation
   - Focuses on core calculation

2. **Detailed Implementation** ([`implementation-detailed.js`](./implementation-detailed.js))
   - Returns full breakdown
   - Enhanced error messages

Both implementations pass the same test suite because they satisfy the same MCP contract.

## Running

```bash
# Install dependencies
npm install ajv

# Run tests against simple implementation
node test.js simple

# Run tests against detailed implementation
node test.js detailed

# Run tests against both
node test.js all
```

## Key SDD Principles

1. ✓ **Spec First**: MCP schema defined before any implementation
2. ✓ **Machine Readable**: JSON Schema enables automatic validation
3. ✓ **Multiple Implementations**: Both simple and detailed versions work
4. ✓ **Tests Target Contract**: Same tests for different implementations
5. ✓ **AI Can Generate**: LLM can read spec + tests and generate code

## AI Generation Example

You can prompt an LLM:

```
Given this MCP tool specification:
[paste spec.json contents]

And these test requirements:
- Calculate total = price * (1 - discount) * (1 + taxRate)
- Reject negative prices
- Reject invalid tax rates (outside 0-1)
- Reject invalid discounts (outside 0-1)

Generate a JavaScript implementation that passes validation.
```

The LLM can generate correct code because:
- Schema provides exact types and constraints
- Tests define expected behaviors
- MCP format is AI-native
