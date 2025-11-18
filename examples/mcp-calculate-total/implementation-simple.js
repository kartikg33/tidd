// Simple implementation of calculate_total MCP tool
// This implementation focuses on core calculation logic

const Ajv = require('ajv');
const spec = require('./spec.json');

const ajv = new Ajv();
const validate = ajv.compile(spec.inputSchema);

/**
 * Calculate total price with tax and optional discount
 * @param {Object} params - Input parameters
 * @param {number} params.price - Base price
 * @param {number} params.taxRate - Tax rate as decimal
 * @param {number} [params.discount=0] - Discount rate as decimal
 * @returns {Object} Result with total
 */
function calculate_total(params) {
  // Validate input against MCP schema
  const valid = validate(params);
  if (!valid) {
    const errors = validate.errors
      .map(err => `${err.instancePath || 'input'} ${err.message}`)
      .join(', ');
    throw new Error(`Invalid input: ${errors}`);
  }
  
  const { price, taxRate, discount = 0 } = params;
  
  // Core calculation
  const priceAfterDiscount = price * (1 - discount);
  const total = priceAfterDiscount * (1 + taxRate);
  
  return {
    total: Math.round(total * 100) / 100 // Round to 2 decimal places
  };
}

module.exports = { calculate_total };
