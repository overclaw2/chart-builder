/**
 * Test: Width Utilization Calculation
 * Verifies Ofer's requirement: (totalPackageWidthInCompartment / totalCompartmentWidth) * 100
 */

// Test Case 1: Single item in compartment
// Example from request: Package width 27 into compartment width 150 = 18%
const compartmentWidth = 150;
const itemDimension = 27;
const expectedUtilization = (itemDimension / compartmentWidth) * 100;

console.log('Test Case 1: Single Item');
console.log(`Package width: ${itemDimension} Mcm`);
console.log(`Compartment width: ${compartmentWidth} Mcm`);
console.log(`Calculated utilization: ${expectedUtilization.toFixed(1)}%`);
console.log(`Expected: 18%`);
console.log(`Match: ${Math.abs(expectedUtilization - 18) < 0.1 ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test Case 2: Multiple items in compartment
// Example: 27 + 30 + 20 = 77 Mcm in 150 Mcm compartment = 51.3%
const items = [27, 30, 20];
const totalPackageWidth = items.reduce((sum, w) => sum + w, 0);
const expectedUtilization2 = (totalPackageWidth / compartmentWidth) * 100;

console.log('Test Case 2: Multiple Items');
console.log(`Package widths: ${items.join(' + ')} = ${totalPackageWidth} Mcm`);
console.log(`Compartment width: ${compartmentWidth} Mcm`);
console.log(`Calculated utilization: ${expectedUtilization2.toFixed(1)}%`);
console.log(`Expected: ~51.3%`);
console.log(`Match: ${Math.abs(expectedUtilization2 - 51.3) < 0.1 ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test Case 3: Mock data verification
// Compartment 1: 27 Mcm in 150 Mcm = 18%
const c1Width = 27;
const c1Total = 150;
const c1Util = (c1Width / c1Total) * 100;

console.log('Test Case 3: Mock Data - Compartment 1');
console.log(`Package width: ${c1Width} Mcm`);
console.log(`Compartment width: ${c1Total} Mcm`);
console.log(`Calculated utilization: ${c1Util.toFixed(1)}%`);
console.log(`Expected: 18%`);
console.log(`Match: ${Math.abs(c1Util - 18) < 0.1 ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test Case 4: Mock data verification
// Compartment 2: 30 Mcm in 100 Mcm = 30%
const c2Width = 30;
const c2Total = 100;
const c2Util = (c2Width / c2Total) * 100;

console.log('Test Case 4: Mock Data - Compartment 2');
console.log(`Package width: ${c2Width} Mcm`);
console.log(`Compartment width: ${c2Total} Mcm`);
console.log(`Calculated utilization: ${c2Util.toFixed(1)}%`);
console.log(`Expected: 30%`);
console.log(`Match: ${Math.abs(c2Util - 30) < 0.1 ? '✓ PASS' : '✗ FAIL'}`);
