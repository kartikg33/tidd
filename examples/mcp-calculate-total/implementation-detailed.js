// Detailed implementation of calculate_total MCP tool
// This implementation provides full breakdown and enhanced error handling

const Ajv = require('ajv');
const spec = require('./spec.json');

const ajv = new Ajv();
const validate = ajv.compile(spec.inputSchema);

/**
 * Calculate total price with tax and optional discount
 * Provides detailed breakdown of the calculation
 * @param {Object} params - Input parameters
 * @param {number} params.price - Base price
 * @param {number} params.taxRate - Tax rate as decimal
 * @param {number} [params.discount=0] - Discount rate as decimal
 * @returns {Object} Result with total and breakdown
 */
function calculate_total(params) {
  // Validate input against MCP schema
  const valid = validate(params);
  if (!valid) {
    const errors = validate.errors.map(err => {
      const field = err.instancePath.replace('/', '') || err.params.missingProperty || 'input';
      const message = err.message;
      return `${field}: ${message}`;
    }).join('; ');
    throw new Error(`Validation failed: ${errors}`);
  }
  
  const { price, taxRate, discount = 0 } = params;
  
  // Detailed calculation with breakdown
  const originalPrice = price;
  const discountAmount = price * discount;
  const priceAfterDiscount = price - discountAmount;
  const taxAmount = priceAfterDiscount * taxRate;
  const finalTotal = priceAfterDiscount + taxAmount;
  
  // Round all values to 2 decimal places
  const round = (num) => Math.round(num * 100) / 100;
  
  return {
    total: round(finalTotal),
    breakdown: {
      originalPrice: round(originalPrice),
      discountAmount: round(discountAmount),
      priceAfterDiscount: round(priceAfterDiscount),
      taxAmount: round(taxAmount),
      finalTotal: round(finalTotal)
    }
  };
}

module.exports = { calculate_total };
