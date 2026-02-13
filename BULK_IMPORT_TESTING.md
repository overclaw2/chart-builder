# Bulk Import Feature - Testing Guide

## Quick Start Test (5 minutes)

### Prerequisites
- Angular 14+ dev environment
- Port 4201 available (or modify ng serve command)
- `sample-import.csv` file in project root

### Steps

1. **Start Dev Server**
   ```bash
   cd chart-builder
   npm install  # If needed
   ng serve --port 4201
   ```

2. **Open Application**
   ```
   http://localhost:4201
   ```

3. **Locate Bulk Import Button**
   - Look for floating purple button labeled "📥 Bulk Import"
   - Located at bottom-right of viewport

4. **Open Import Dialog**
   - Click the "📥 Bulk Import" button
   - Modal should appear with "Upload" tab active

5. **Select CSV File**
   - Click "📎 Choose File" button
   - Select `sample-import.csv` from project root
   - File info should display: "sample-import.csv" and size

6. **Verify Delimiter**
   - Default should be "Comma (,)"
   - File uses comma delimiter, so no change needed

7. **Proceed to Column Mapping**
   - Click "Next: Map Columns →" button
   - Should show 4 columns: Name, Weight (Kg), Destination, Dimensions (Mcm)

8. **Verify Auto-Mapping**
   - Name → Name (mapped correctly)
   - Weight (Kg) → weight (mapped correctly)
   - Destination → destination (mapped correctly)
   - Dimensions (Mcm) → dimensions (mapped correctly)
   - All required fields should be green/checked

9. **Preview First Row**
   - Should show: "Xiaomi Package | 180 | SINGAPORE | 35"

10. **Proceed to Validation**
    - Click "Next: Validate →" button
    - Wait for validation to complete
    - Should show: "30 Total, 30 Valid, 0 Errors, 0 Duplicates"

11. **Review Validation Stats**
    - Total Rows: 30
    - Valid: 30
    - Errors: 0
    - Duplicates: 0
    - Success message: "All validations passed!"

12. **Preview Packages**
    - Click "Next: Preview →" button
    - Should see table with first 5 packages
    - Pagination controls: "Previous", "Page 1 of 6", "Next"
    - Statistics at bottom:
      - Packages to import: 30
      - Total weight: 5,340 Kg
      - Average dimensions: 36 Mcm

13. **Import Packages**
    - Click "✓ Import 30 Packages" button
    - Should see loading spinner with "Importing Packages..."
    - After ~2 seconds, success screen should appear

14. **Verify Import Success**
    - Success message: "30 packages have been successfully added"
    - Modal auto-closes after 2 seconds

15. **Verify in Available Packages**
    - Check Available Packages panel (left sidebar)
    - Count should increase by 30
    - New packages should be visible in the list
    - Each package shows: name, dimensions, weight, destination

## Detailed Test Cases

### Test Case 1: Successful Import with Sample Data
**Objective**: Verify normal import workflow
**Prerequisites**: sample-import.csv file exists
**Steps**: Follow Quick Start Test above
**Expected Result**: 30 packages imported successfully

### Test Case 2: Delimiter Testing (Tab)
**Objective**: Test TSV (tab-separated) file support
**Steps**:
1. Create test-tab.csv with tab delimiters
2. Open Bulk Import
3. Select test-tab.csv
4. Change delimiter to "Tab"
5. Verify columns are parsed correctly
6. Complete import
**Expected Result**: File parsed correctly with tab delimiter

### Test Case 3: Semicolon Delimiter
**Objective**: Test semicolon-separated file
**Steps**:
1. Create test-semicolon.csv with semicolon delimiters
2. Open Bulk Import
3. Select file
4. Change delimiter to "Semicolon (;)"
5. Verify parsing
**Expected Result**: File parsed correctly

### Test Case 4: Validation - Missing Required Field
**Objective**: Test validation catches missing fields
**Steps**:
1. Create CSV with missing "Name" column
2. Open Bulk Import
3. Select file
4. Try to map columns (Name field unavailable)
5. Click "Next: Validate →"
**Expected Result**: Validation fails, rows marked as errors

### Test Case 5: Validation - Invalid Weight
**Objective**: Test weight validation
**Steps**:
1. Create CSV with invalid weight (non-numeric or negative)
2. Complete mapping
3. Proceed to validation
**Expected Result**: Errors reported with row numbers and values

### Test Case 6: Validation - Weight Exceeds Limit
**Objective**: Test max weight constraint (1000kg)
**Steps**:
1. Create CSV with weight = 1001
2. Complete validation
**Expected Result**: Error "Weight exceeds maximum limit (1000 kg)"

### Test Case 7: Validation - Invalid Dimensions
**Objective**: Test dimensions validation
**Steps**:
1. Create CSV with dimensions = 501 or non-numeric
2. Complete validation
**Expected Result**: Error about exceeding limit or invalid type

### Test Case 8: Column Mapping Override
**Objective**: Test manual field remapping
**Steps**:
1. Import sample-import.csv
2. On mapping step, change one mapping
   - E.g., map "Destination" to "dimensions" instead
3. Try validation
**Expected Result**: 
   - Preview should show remapped values
   - Validation should catch incorrect types

### Test Case 9: Pagination
**Objective**: Test preview pagination
**Steps**:
1. Import sample-import.csv
2. Reach preview step
3. Click "Next →" button
4. Verify page changes to "Page 2 of 6"
5. Click "Previous" multiple times
6. Verify page tracking
**Expected Result**: Pagination works correctly

### Test Case 10: Dark Mode
**Objective**: Test dark mode styling
**Steps**:
1. Open Bulk Import in light mode
2. Toggle dark mode (if available)
3. Modal should update colors
4. Check all elements are readable
**Expected Result**: Dark mode styling applied correctly

### Test Case 11: Mobile Responsive
**Objective**: Test mobile layout
**Steps**:
1. Open browser DevTools
2. Toggle device emulation (iPhone 12)
3. Open Bulk Import
4. Verify layout on mobile
5. Test pagination buttons
6. Check modal fits screen
**Expected Result**: Layout responsive and usable on mobile

### Test Case 12: Very Large File
**Objective**: Test performance with large import
**Steps**:
1. Create CSV with 1000+ rows
2. Open Bulk Import
3. Select file
4. Monitor parsing performance
5. Check validation speed
6. Verify preview handles large data
**Expected Result**: Smooth performance, no freezing

### Test Case 13: Duplicate Detection
**Objective**: Test duplicate ID detection
**Steps**:
1. Import sample-import.csv once
2. Open Bulk Import again
3. Try importing same file
**Expected Result**: Duplicates detected and removed from import

### Test Case 14: localStorage Persistence
**Objective**: Test delimiter preference saving
**Steps**:
1. Open Bulk Import
2. Change delimiter to Tab
3. Close modal
4. Reopen Bulk Import
5. Check delimiter setting
**Expected Result**: Delimiter preference is remembered

### Test Case 15: Form Validation - Empty CSV
**Objective**: Test empty file handling
**Steps**:
1. Create empty CSV file
2. Try to import
**Expected Result**: Error message "File is empty or could not be parsed"

## Edge Cases to Test

1. **Special Characters**: Package names with & @ # $ %
2. **Unicode**: Destination names with non-ASCII characters
3. **Quoted Fields**: CSV with values containing commas: "Smith, John"
4. **Extra Spaces**: Leading/trailing whitespace in values
5. **Very Long Names**: Package names > 100 characters
6. **Case Sensitivity**: Destination in mixed case (SINGAPORE vs Singapore)
7. **Floating Point**: Weight with decimals: 125.5 Kg
8. **Zero Values**: Weight = 0 (should fail validation)
9. **Negative Values**: Weight = -50 (should fail)
10. **Scientific Notation**: Weight = 1e2 (100)

## Performance Benchmarks

### Expected Timings
- **File Selection → Parsing**: <100ms
- **Delimiter Change Reparsing**: <200ms
- **Mapping Update**: <50ms
- **Validation (30 rows)**: 500-800ms
- **Validation (1000 rows)**: 5-10s
- **Import Complete**: <2s
- **Modal Animation**: 300ms

### Browser Developer Tools Check
1. Open DevTools → Performance tab
2. Start recording before opening modal
3. Complete import process
4. Stop recording
5. Check for:
   - No long tasks (>50ms)
   - Smooth 60fps animations
   - No memory leaks

## Accessibility Testing

1. **Keyboard Navigation**
   - Tab through all form fields
   - Enter to submit
   - Esc to close

2. **Screen Reader (NVDA/JAWS)**
   - Modal title announced
   - Button labels clear
   - Error messages readable
   - Form fields labeled

3. **Color Contrast**
   - Text readable in light/dark mode
   - Color-blind friendly
   - Required field indicators clear

## Browser Compatibility

Test on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS)

## Known Limitations

1. **No real-time file size check**: Large files may take time
2. **No progress bar during validation**: Shows spinner for 0.5s
3. **No cancel during import**: Button disabled while processing
4. **Limited cell width**: Very long values truncated in preview

## Reporting Bugs

If issues found, document:
- Browser and version
- OS (Windows/Mac/Linux)
- Steps to reproduce
- Expected vs actual result
- Screenshot if applicable
- Console errors (DevTools)

## Sign-Off Checklist

- [ ] All test cases passed
- [ ] No console errors
- [ ] Dark mode works correctly
- [ ] Mobile layout responsive
- [ ] Validation catches all errors
- [ ] Pagination works smoothly
- [ ] localStorage saves preferences
- [ ] Performance acceptable
- [ ] Accessibility acceptable
- [ ] Browser compatibility verified
- [ ] Edge cases handled
- [ ] Ready for production

---

**Test Date**: ___________
**Tester Name**: ___________
**Browser**: ___________
**Result**: PASS / FAIL

**Notes**:
```
[Add any observations or issues found]
```
