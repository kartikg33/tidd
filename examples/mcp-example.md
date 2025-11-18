# MCP as Testable Interface Contracts

This example demonstrates how to use MCP (Model Context Protocol) specifications as executable contracts following SDD principles.

## Overview

MCP tool definitions serve as **formal specifications** that:
- Define exact input/output schemas (JSON Schema)
- Are machine-readable by LLMs
- Enable automatic validation
- Allow multiple implementations against the same contract

## Example: File Operations Tool

### 1. The Specification (MCP Tool Schema)

```json
{
  "name": "read_file",
  "description": "Read contents of a file with optional line range filtering",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Absolute path to the file to read",
        "pattern": "^/.*"
      },
      "start_line": {
        "type": "integer",
        "minimum": 1,
        "description": "Optional starting line number (1-indexed)"
      },
      "end_line": {
        "type": "integer",
        "minimum": 1,
        "description": "Optional ending line number (inclusive). Use -1 for end of file"
      }
    },
    "required": ["path"],
    "additionalProperties": false
  }
}
```

### 2. Behavior Specifications (Test Cases)

```javascript
// test_read_file_spec.js
const assert = require('assert');

// These tests validate the CONTRACT, not the implementation
const specTests = {
  
  // Test 1: Basic file reading
  async test_reads_entire_file({ read_file }) {
    const result = await read_file({
      path: "/test/sample.txt"
    });
    
    assert(typeof result === 'string');
    assert(result.length > 0);
  },
  
  // Test 2: Line range filtering
  async test_reads_line_range({ read_file }) {
    const result = await read_file({
      path: "/test/sample.txt",
      start_line: 5,
      end_line: 10
    });
    
    const lines = result.split('\n');
    assert(lines.length === 6); // Lines 5-10 inclusive
  },
  
  // Test 3: Input validation - rejects relative paths
  async test_rejects_relative_path({ read_file }) {
    try {
      await read_file({ path: "relative/path.txt" });
      assert.fail("Should have rejected relative path");
    } catch (error) {
      assert(error.message.includes("path"));
    }
  },
  
  // Test 4: Input validation - rejects invalid line numbers
  async test_rejects_invalid_line_numbers({ read_file }) {
    try {
      await read_file({ 
        path: "/test/sample.txt",
        start_line: 0 // Invalid: minimum is 1
      });
      assert.fail("Should have rejected line number < 1");
    } catch (error) {
      assert(error.message.includes("minimum"));
    }
  },
  
  // Test 5: End of file marker
  async test_end_of_file_marker({ read_file }) {
    const result = await read_file({
      path: "/test/sample.txt",
      start_line: 5,
      end_line: -1 // Read to end
    });
    
    assert(result.length > 0);
    // Result should contain everything from line 5 onwards
  },
  
  // Test 6: File not found handling
  async test_handles_missing_file({ read_file }) {
    try {
      await read_file({ path: "/nonexistent/file.txt" });
      assert.fail("Should have thrown error for missing file");
    } catch (error) {
      assert(error.code === 'ENOENT' || error.message.includes("not found"));
    }
  }
};

module.exports = specTests;
```

### 3. Implementation A: Node.js with fs

```javascript
// implementation_node.js
const fs = require('fs').promises;
const Ajv = require('ajv');

// Load the MCP schema
const schema = require('./read_file_schema.json');
const ajv = new Ajv();
const validate = ajv.compile(schema.inputSchema);

async function read_file(params) {
  // Validate against schema
  const valid = validate(params);
  if (!valid) {
    throw new Error(`Invalid input: ${ajv.errorsText(validate.errors)}`);
  }
  
  const { path, start_line, end_line } = params;
  
  // Read file
  const content = await fs.readFile(path, 'utf-8');
  
  // Apply line filtering if specified
  if (start_line !== undefined || end_line !== undefined) {
    const lines = content.split('\n');
    const start = (start_line || 1) - 1; // Convert to 0-indexed
    const end = end_line === -1 ? lines.length : end_line;
    
    return lines.slice(start, end).join('\n');
  }
  
  return content;
}

module.exports = { read_file };
```

### 4. Implementation B: Python with pathlib

```python
# implementation_python.py
import json
import jsonschema
from pathlib import Path

# Load the MCP schema
with open('read_file_schema.json') as f:
    schema = json.load(f)

def read_file(params):
    # Validate against schema
    jsonschema.validate(params, schema['inputSchema'])
    
    path = params['path']
    start_line = params.get('start_line')
    end_line = params.get('end_line')
    
    # Read file
    content = Path(path).read_text()
    
    # Apply line filtering if specified
    if start_line is not None or end_line is not None:
        lines = content.split('\n')
        start = (start_line or 1) - 1  # Convert to 0-indexed
        end = len(lines) if end_line == -1 else end_line
        
        return '\n'.join(lines[start:end])
    
    return content
```

### 5. Running the Tests

```javascript
// run_tests.js
const specTests = require('./test_read_file_spec');

async function runTestsAgainstImplementation(implementation, name) {
  console.log(`\nTesting implementation: ${name}`);
  
  let passed = 0;
  let failed = 0;
  
  for (const [testName, testFunc] of Object.entries(specTests)) {
    try {
      await testFunc(implementation);
      console.log(`  ✓ ${testName}`);
      passed++;
    } catch (error) {
      console.log(`  ✗ ${testName}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test both implementations against the same spec
async function main() {
  const nodeImpl = require('./implementation_node');
  const pythonImpl = require('./implementation_python'); // Via subprocess or similar
  
  const nodeResult = await runTestsAgainstImplementation(nodeImpl, "Node.js");
  const pythonResult = await runTestsAgainstImplementation(pythonImpl, "Python");
  
  if (nodeResult && pythonResult) {
    console.log("\n✓ All implementations satisfy the MCP contract!");
  } else {
    console.log("\n✗ Some implementations failed contract validation");
    process.exit(1);
  }
}

main();
```

## Key SDD Principles Demonstrated

### 1. **Specification First**
The MCP schema defines the contract before any implementation exists.

### 2. **Machine-Readable**
JSON Schema is parseable by both validation tools and LLMs.

### 3. **Multiple Implementations**
Both Node.js and Python implementations satisfy the same contract.

### 4. **Automatic Validation**
Input validation is generated directly from the schema.

### 5. **Test Against Contract**
Tests validate the contract, not implementation details.

### 6. **AI Can Generate**
An LLM can read the MCP schema + tests and generate a correct implementation.

## Generating Implementation with AI

Given the MCP schema above, you can prompt an LLM:

```
Given this MCP tool specification:
[paste JSON schema]

And these required behaviors:
[paste test cases]

Generate a TypeScript implementation that satisfies this contract.
```

The LLM can generate a valid implementation because:
- The schema defines exact input/output types
- The tests define expected behaviors
- The constraints are machine-readable

## Benefits for SDD

1. **No ambiguity**: MCP schemas are precise
2. **Automatic validation**: JSON Schema validators exist for all languages
3. **LLM-friendly**: Designed for AI consumption
4. **Version control**: Schema changes are tracked
5. **Language agnostic**: Any language can implement MCP tools
6. **Tool ecosystem**: Existing MCP tooling validates implementations

## Evolving the Contract

When requirements change:

1. **Update the MCP schema** (with version bump if breaking)
2. **Add new test cases** for new behaviors
3. **Regenerate/update implementations**
4. **Validate** all implementations still pass

Example: Adding file encoding support:

```json
{
  "name": "read_file",
  "version": "2.0.0",  // Version bump
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "pattern": "^/.*" },
      "start_line": { "type": "integer", "minimum": 1 },
      "end_line": { "type": "integer", "minimum": 1 },
      "encoding": {  // NEW property
        "type": "string",
        "enum": ["utf-8", "ascii", "latin1"],
        "default": "utf-8"
      }
    },
    "required": ["path"]
  }
}
```

All existing implementations must be updated to support the new parameter, but tests ensure they still satisfy the contract.

## Conclusion

MCP specifications are ideal testable interface contracts because they:
- Define precise schemas (JSON Schema)
- Enable automatic validation
- Are LLM-readable and LLM-generatable
- Support multiple implementations in any language
- Can evolve while maintaining backward compatibility

This makes MCP a perfect example of **Spec Driven Development** in practice.
