// Test suite for calculate_total MCP tool
// These tests validate the CONTRACT, not the implementation

const Ajv = require('ajv');
const spec = require('./spec.json');

const ajv = new Ajv();
const validateInput = ajv.compile(spec.inputSchema);
const validateOutput = ajv.compile(spec.outputSchema);

/**
 * Test runner that validates any implementation against the MCP contract
 */
async function runTests(implementation, name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));
  
  const tests = [
    {
      name: "Basic calculation without discount",
      input: { price: 100, taxRate: 0.08 },
      expected: 108,
      validate: (result) => {
        assert(Math.abs(result.total - 108) < 0.01, 
          `Expected 108, got ${result.total}`);
      }
    },
    {
      name: "Calculation with discount",
      input: { price: 100, taxRate: 0.08, discount: 0.10 },
      expected: 97.2,
      validate: (result) => {
        // (100 - 10%) = 90, then 90 * 1.08 = 97.2
        assert(Math.abs(result.total - 97.2) < 0.01,
          `Expected 97.2, got ${result.total}`);
      }
    },
    {
      name: "Zero discount same as no discount",
      input: { price: 50, taxRate: 0.05, discount: 0 },
      expected: 52.5,
      validate: (result) => {
        assert(Math.abs(result.total - 52.5) < 0.01,
          `Expected 52.5, got ${result.total}`);
      }
    },
    {
      name: "Input validation passes for valid input",
      input: { price: 100, taxRate: 0.08 },
      validate: (result) => {
        const valid = validateInput({ price: 100, taxRate: 0.08 });
        assert(valid, "Valid input should pass schema validation");
      }
    },
    {
      name: "Output validation passes for valid output",
      input: { price: 100, taxRate: 0.08 },
      validate: (result) => {
        const valid = validateOutput(result);
        assert(valid, `Output should match schema: ${ajv.errorsText(validateOutput.errors)}`);
      }
    },
    {
      name: "Rejects negative price",
      input: { price: -10, taxRate: 0.08 },
      shouldThrow: true,
      validate: (error) => {
        assert(error, "Should throw error for negative price");
        assert(error.message.includes("price") || error.message.includes("minimum"),
          `Error should mention price or minimum: ${error.message}`);
      }
    },
    {
      name: "Rejects tax rate > 1",
      input: { price: 100, taxRate: 1.5 },
      shouldThrow: true,
      validate: (error) => {
        assert(error, "Should throw error for tax rate > 1");
        assert(error.message.includes("taxRate") || error.message.includes("maximum"),
          `Error should mention taxRate or maximum: ${error.message}`);
      }
    },
    {
      name: "Rejects negative tax rate",
      input: { price: 100, taxRate: -0.05 },
      shouldThrow: true,
      validate: (error) => {
        assert(error, "Should throw error for negative tax rate");
      }
    },
    {
      name: "Rejects discount > 1",
      input: { price: 100, taxRate: 0.08, discount: 1.2 },
      shouldThrow: true,
      validate: (error) => {
        assert(error, "Should throw error for discount > 1");
        assert(error.message.includes("discount") || error.message.includes("maximum"),
          `Error should mention discount or maximum: ${error.message}`);
      }
    },
    {
      name: "Rejects missing required field (price)",
      input: { taxRate: 0.08 },
      shouldThrow: true,
      validate: (error) => {
        assert(error, "Should throw error for missing price");
        assert(error.message.includes("price") || error.message.includes("required"),
          `Error should mention price or required: ${error.message}`);
      }
    },
    {
      name: "Rejects missing required field (taxRate)",
      input: { price: 100 },
      shouldThrow: true,
      validate: (error) => {
        assert(error, "Should throw error for missing taxRate");
        assert(error.message.includes("taxRate") || error.message.includes("required"),
          `Error should mention taxRate or required: ${error.message}`);
      }
    },
    {
      name: "100% discount results in only tax on zero",
      input: { price: 100, taxRate: 0.08, discount: 1.0 },
      validate: (result) => {
        // 100 * (1 - 1.0) = 0, then 0 * 1.08 = 0
        assert(Math.abs(result.total) < 0.01,
          `Expected ~0, got ${result.total}`);
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test.shouldThrow) {
        // Test should throw an error
        let error = null;
        try {
          await implementation.calculate_total(test.input);
        } catch (e) {
          error = e;
        }
        test.validate(error);
      } else {
        // Test should succeed
        const result = await implementation.calculate_total(test.input);
        test.validate(result);
      }
      console.log(`  ✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  ✗ ${test.name}`);
      console.log(`    ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';
  
  let allPassed = true;
  
  if (target === 'simple' || target === 'all') {
    const simpleImpl = require('./implementation-simple');
    const passed = await runTests(simpleImpl, "Simple Implementation");
    allPassed = allPassed && passed;
  }
  
  if (target === 'detailed' || target === 'all') {
    const detailedImpl = require('./implementation-detailed');
    const passed = await runTests(detailedImpl, "Detailed Implementation");
    allPassed = allPassed && passed;
  }
  
  if (target !== 'simple' && target !== 'detailed' && target !== 'all') {
    console.error(`Unknown target: ${target}`);
    console.error('Usage: node test.js [simple|detailed|all]');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✓ All implementations satisfy the MCP contract!');
    console.log('='.repeat(60));
  } else {
    console.log('✗ Some implementations failed contract validation');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
