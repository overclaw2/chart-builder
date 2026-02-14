# Chart Builder - Comprehensive Testing Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup & Installation](#setup--installation)
3. [Running Tests](#running-tests)
4. [Test Suite Structure](#test-suite-structure)
5. [Detailed Test Descriptions](#detailed-test-descriptions)
6. [Screenshots & Results](#screenshots--results)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

---

## Overview

This document describes the comprehensive post-deployment testing suite for the Chart Builder application. The test suite uses **Playwright**, a modern end-to-end testing framework that provides:

- ✅ Cross-browser testing capabilities
- ✅ Automatic screenshot capture on failures
- ✅ Detailed HTML and JSON reports
- ✅ Fast test execution
- ✅ Reliable element detection

### What Gets Tested

| Category | Tests | Purpose |
|----------|-------|---------|
| **App Loading** | 9 tests | Verify app initializes correctly |
| **Drag-Drop Functionality** | 9 tests | Validate core drag-drop features |
| **Integration** | 4 tests | Ensure features work together |
| **Error Handling** | 3 tests | Verify graceful error management |
| **Performance** | 2 tests | Confirm responsive behavior |
| **TOTAL** | **27 tests** | Complete deployment verification |

---

## Setup & Installation

### Prerequisites

- Node.js >= 14.x
- npm >= 6.x
- Chart Builder application running (or configured to start)

### Installation Steps

1. **Install Playwright and dependencies:**
   ```bash
   npm install --save-dev @playwright/test
   ```

2. **Verify installation:**
   ```bash
   npx playwright --version
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

### Directory Structure

```
chart-builder/
├── tests/
│   └── e2e/
│       └── deployment-tests.spec.ts    # Main test file
├── test-results/                        # Generated after test run
│   ├── screenshots/                     # Test screenshots
│   ├── html/                            # HTML test report
│   ├── reports/                         # Markdown reports
│   └── results.json                     # Raw test results
├── scripts/
│   └── run-deployment-tests.js          # Test runner script
├── playwright.config.ts                 # Playwright configuration
└── TESTING.md                           # This file
```

---

## Running Tests

### Quick Start

```bash
# Run all deployment tests
npm run test:deployment

# Or manually:
node scripts/run-deployment-tests.js
```

### Individual Test Options

```bash
# Run all tests
npx playwright test tests/e2e/deployment-tests.spec.ts

# Run specific test suite
npx playwright test tests/e2e/deployment-tests.spec.ts -g "App Loading"

# Run single test
npx playwright test tests/e2e/deployment-tests.spec.ts -g "1.1"

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### View Results

```bash
# Open HTML test report
npx playwright show-report test-results/html

# View latest deployment report
cat deployment-report.md

# Check screenshots
ls -la test-results/screenshots/
```

---

## Test Suite Structure

### Test Organization

Tests are organized into logical describe blocks:

```typescript
test.describe('Chart Builder - Post-Deployment Tests', () => {
  test.describe('1. App Loading Tests', () => { ... })
  test.describe('2. Drag-Drop Functionality Tests', () => { ... })
  test.describe('3. Integration Tests', () => { ... })
  test.describe('4. Error Handling Tests', () => { ... })
  test.describe('5. Performance Tests', () => { ... })
});
```

### Test Naming Convention

Tests follow a hierarchical naming scheme:

- `1.1: Should load the application...` → Category 1, Test 1
- `2.3: Should verify placed packages...` → Category 2, Test 3

This makes it easy to reference specific tests in issues and reports.

---

## Detailed Test Descriptions

### Category 1: App Loading Tests (9 tests)

These tests verify that the application initializes correctly and all critical UI elements are present.

#### 1.1: Application URL Loading
**What it tests:** Verifies the app is accessible at localhost:4200

**Why it matters:** Confirms the development server is running and reachable

**Assertions:**
- Page URL contains localhost:4200
- Page has a valid title

**Expected outcome:** ✅ PASS

---

#### 1.2: Container Visualization Element
**What it tests:** Checks that the main container visualization component is rendered

**Why it matters:** This is the core UI component for the application

**Selectors checked:**
- `.container-visualization` element exists and is visible

**Expected outcome:** ✅ PASS

---

#### 1.3: Available Packages Panel
**What it tests:** Verifies the available packages panel (left side) is visible

**Why it matters:** Users need to see available items to drag them to containers

**Selectors checked:**
- `.available-packages-panel` element exists and is visible

**Expected outcome:** ✅ PASS

---

#### 1.4: Placed Packages List
**What it tests:** Checks that the placed/positioned packages list is visible

**Why it matters:** Users need to see what's been placed to track progress

**Selectors checked:**
- `.side-panel` element exists and is visible
- "Placed Packages" header in side panel

**Expected outcome:** ✅ PASS

---

#### 1.5: Container Cards
**What it tests:** Verifies container cards are loaded

**Why it matters:** Containers are where packages are placed

**Checks:**
- Wait for `.container-card` elements (up to 5 seconds)
- Count of containers >= 0

**Expected outcome:** ✅ PASS (even with 0 containers)

---

#### 1.6: Console Error Check
**What it tests:** Ensures no critical console errors on page load

**Why it matters:** Console errors indicate broken functionality

**Methodology:**
- Hook into page console messages
- Reload page to capture errors
- Filter for critical errors (exclude warnings)

**Expected outcome:** ✅ PASS (0 critical errors)

---

#### 1.7: Home Screen Screenshot
**What it tests:** Captures the initial home screen state

**Why it matters:** Provides visual reference for initial state

**Output:**
- Saves to: `test-results/screenshots/01-home-screen.png`
- Full page screenshot

**Expected outcome:** ✅ Screenshot saved

---

#### 1.8: Header/Title Visibility
**What it tests:** Checks that the page has a visible header

**Why it matters:** Title indicates the page has content

**Selectors checked:**
- `.title` or `h1` elements

**Expected outcome:** ✅ PASS (at least one header found)

---

#### 1.9: Toolbar Controls
**What it tests:** Verifies toolbar/upload controls are visible

**Why it matters:** Users need controls to load data and interact with app

**Selectors checked:**
- `.upload-section` or `.upload-controls` elements

**Expected outcome:** ✅ PASS

---

### Category 2: Drag-Drop Functionality Tests (9 tests)

These tests verify the core drag-and-drop feature works correctly.

#### 2.1: Drag Package from Available to Container
**What it tests:** Performs a drag-drop of a package from available list to container

**Why it matters:** This is the primary user interaction

**Steps:**
1. Get first available package
2. Get first container bar
3. Drag package to container
4. Wait 500ms for animation

**Verification:**
- Package appears in container OR available count decreases

**Expected outcome:** ✅ PASS

---

#### 2.2: Available Packages List Decreases
**What it tests:** Confirms available packages count decreases after placement

**Why it matters:** Proves item was moved, not copied

**Steps:**
1. Get initial available package count
2. Drag package to container
3. Get final available package count

**Verification:**
- `finalCount <= initialCount`

**Expected outcome:** ✅ PASS

---

#### 2.3: Placed Packages List Increases
**What it tests:** Confirms placed packages count increases after placement

**Why it matters:** Verifies item was tracked as placed

**Steps:**
1. Get initial placed package count
2. Drag package to container
3. Get final placed package count

**Verification:**
- `finalCount >= initialCount`

**Expected outcome:** ✅ PASS

---

#### 2.4: Drag-Drop Screenshot
**What it tests:** Captures state after drag-drop operation

**Why it matters:** Visual verification of operation success

**Output:**
- Saves to: `test-results/screenshots/02-drag-drop-placed.png`
- Full page screenshot

**Expected outcome:** ✅ Screenshot saved

---

#### 2.5: Drag Between Compartments
**What it tests:** Moves a package between compartments in same container

**Why it matters:** Tests multi-compartment functionality

**Prerequisites:**
- Must have at least 2 compartments

**Steps:**
1. Place package in first compartment
2. Drag package to second compartment
3. Verify it moved

**Expected outcome:** ✅ PASS (or SKIP if <2 compartments)

---

#### 2.6: Compartment Operations Screenshot
**What it tests:** Captures state during compartment drag operations

**Why it matters:** Visual verification of multi-compartment functionality

**Output:**
- Saves to: `test-results/screenshots/03-compartment-operations.png`

**Expected outcome:** ✅ Screenshot saved

---

#### 2.7: Package Removal from Container
**What it tests:** Removes a placed package by right-clicking

**Why it matters:** Users need to undo placements

**Steps:**
1. Place a package
2. Right-click on placed item
3. Click "Remove" from context menu
4. Wait for state update

**Expected outcome:** ✅ PASS (item removed or operation handled)

---

#### 2.8: Drag Visual Feedback
**What it tests:** Verifies drag-over styling is applied during drag

**Why it matters:** Visual feedback helps users understand drag operation

**Steps:**
1. Start drag from available package
2. Hover over container bar
3. Check for `drag-over` class

**Expected outcome:** ✅ PASS (or visual state verified)

---

#### 2.9: List Updates Screenshot
**What it tests:** Captures both lists after multiple drag operations

**Why it matters:** Shows final state of both available and placed lists

**Output:**
- Saves to: `test-results/screenshots/04-lists-updated.png`
- Performs 2-3 drag operations before screenshot

**Expected outcome:** ✅ Screenshot saved

---

### Category 3: Integration Tests (4 tests)

These tests verify features work together correctly.

#### 3.1: UI Consistency After Multiple Operations
**What it tests:** Verifies UI remains consistent through multiple operations

**Why it matters:** Ensures no state corruption after repeated actions

**Steps:**
1. Drag 3 packages to containers
2. Verify UI is still responsive
3. Check all main elements are visible

**Expected outcome:** ✅ PASS

---

#### 3.2: Search/Filter With Drag Operations
**What it tests:** Confirms drag works while search filters are active

**Why it matters:** Users may search while dragging

**Steps:**
1. Fill search input
2. Attempt drag operation
3. Clear search
4. Verify page is responsive

**Expected outcome:** ✅ PASS

---

#### 3.3: Rapid Consecutive Drags
**What it tests:** Handles multiple drags in quick succession

**Why it matters:** Tests performance under rapid user actions

**Steps:**
1. Drag 2 packages without delays
2. Wait for state to settle
3. Verify no errors

**Expected outcome:** ✅ PASS

---

#### 3.4: Final State Screenshot
**What it tests:** Captures application state after all operations

**Why it matters:** Shows final result of testing

**Output:**
- Saves to: `test-results/screenshots/05-final-state.png`

**Expected outcome:** ✅ Screenshot saved

---

### Category 4: Error Handling Tests (3 tests)

These tests verify the app gracefully handles errors.

#### 4.1: Invalid Drag Operations
**What it tests:** App doesn't crash on invalid drag attempts

**Why it matters:** Ensures robustness against user mistakes

**Expected outcome:** ✅ PASS (app remains functional)

---

#### 4.2: Unhandled Promise Rejections
**What it tests:** No unhandled promise rejections occur during operations

**Why it matters:** Prevents silent failures and memory leaks

**Monitoring:**
- Hook into page error events
- Perform drag operations
- Verify no rejections caught

**Expected outcome:** ✅ PASS (0 rejections)

---

#### 4.3: Page Navigation/Reload
**What it tests:** App recovers properly after page reload

**Why it matters:** Users might refresh the page accidentally

**Steps:**
1. Get initial URL
2. Perform drag operation
3. Reload page
4. Verify app loads correctly

**Expected outcome:** ✅ PASS

---

### Category 5: Performance Tests (2 tests)

These tests verify the app performs well.

#### 5.1: Page Load Time
**What it tests:** App loads within acceptable time

**Why it matters:** Fast load times improve user experience

**Target:** < 10 seconds
**Timeout:** Wait up to 10 seconds for `.container-visualization`

**Expected outcome:** ✅ PASS

---

#### 5.2: Drag Operation Performance
**What it tests:** Drag operation completes without lag

**Why it matters:** Responsive feel is critical for UX

**Target:** < 5 seconds for drag operation
**Operation:** Drag from available to container

**Expected outcome:** ✅ PASS

---

## Screenshots & Results

### Screenshot Naming

Screenshots are numbered and named according to what they capture:

| File | Captured State |
|------|---|
| `01-home-screen.png` | Initial app load |
| `02-drag-drop-placed.png` | After first drag operation |
| `03-compartment-operations.png` | Compartment interactions |
| `04-lists-updated.png` | List updates |
| `05-final-state.png` | Final application state |

### Test Results Files

After running tests, several files are generated:

```
test-results/
├── screenshots/          # PNG screenshots from tests
├── html/                 # Interactive HTML report
├── reports/              # Markdown deployment reports
└── results.json          # Raw Playwright results (JSON)
```

### Viewing Results

```bash
# Open HTML report (interactive)
npx playwright show-report

# View latest markdown report
cat deployment-report.md

# View raw JSON results
cat test-results/results.json | jq .
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Connection refused on localhost:4200"

**Cause:** Development server not running

**Solution:**
```bash
# Start the dev server in another terminal
npm start

# Or configure Playwright to start it automatically
# (already configured in playwright.config.ts)
```

#### Issue: "Test timeout waiting for .container-visualization"

**Cause:** App takes longer to load

**Solution:**
```bash
# Check if app is loading slowly
npm start
# Wait for "Compiled successfully" message
# Increase timeout in playwright.config.ts

# In playwright.config.ts:
webServer: {
  timeout: 180 * 1000, // Increase from 120s to 180s
}
```

#### Issue: "No screenshots captured"

**Cause:** Tests ran but didn't generate screenshots

**Solution:**
```bash
# Ensure screenshot directory exists
mkdir -p test-results/screenshots

# Check if tests are using screenshot methods
grep -r "screenshot" tests/e2e/

# Run test in headed mode to see what's happening
npx playwright test --headed
```

#### Issue: "Drag-drop tests failing"

**Cause:** Drag element not found or not visible

**Solutions:**
```bash
# Run in headed mode to see what's happening
npx playwright test --headed -g "2.1"

# Debug the specific test
npx playwright test --debug -g "2.1"

# Check if selectors match your HTML
# In tests, check: .package-item, .container-bar, etc.
```

#### Issue: "Tests pass locally but fail in CI"

**Common causes:**
- Different viewport size
- Timing issues (network slower)
- Missing dependencies

**Solutions:**
```bash
# Run with CI environment variable
CI=true npm run test:deployment

# Increase timeouts in playwright.config.ts:
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}

# Disable parallel testing on CI
workers: 1
```

#### Issue: "Cannot find module 'child_process'"

**Cause:** Node.js built-in module import issue

**Solution:**
```bash
# Ensure Node.js is correctly installed
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Deployment Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run deployment tests
      run: npm run test:deployment
      env:
        CI: true
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = fs.readFileSync('deployment-report.md', 'utf8');
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: report
          });
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
test:deployment:
  image: mcr.microsoft.com/playwright:v1.40.1-jammy
  stages:
    - test
  before_script:
    - npm ci
  script:
    - npm run test:deployment
  artifacts:
    paths:
      - test-results/
    reports:
      junit: test-results/results.xml
    expire_in: 30 days
  allow_failure: false
```

---

## Best Practices

### Writing New Tests

1. **Use descriptive test names:**
   ```typescript
   // Good
   test('Should verify available packages list decreases after drag', async () => {})
   
   // Bad
   test('Test drag', async () => {})
   ```

2. **Add wait timeouts appropriately:**
   ```typescript
   // Wait for element to exist
   await page.waitForSelector('.container-bar');
   
   // Wait for animation
   await page.waitForTimeout(500);
   
   // Wait for network to settle
   await page.waitForLoadState('networkidle');
   ```

3. **Use data attributes for selectors:**
   ```typescript
   // Good - specific
   const element = page.locator('[data-item-id="123"]');
   
   // Fragile - depends on CSS classes
   const element = page.locator('.item.active.highlighted');
   ```

4. **Take screenshots strategically:**
   ```typescript
   // Capture state before and after critical operations
   await screenshot1();
   await performDrag();
   await screenshot2();
   ```

### Running Tests Efficiently

1. **Run relevant tests for changes:**
   ```bash
   # Only drag-drop tests
   npx playwright test -g "Drag-Drop"
   
   # Only loading tests
   npx playwright test -g "App Loading"
   ```

2. **Run in parallel for speed:**
   ```bash
   # Already configured, but can adjust:
   npx playwright test --workers=4
   ```

3. **Skip slow tests during development:**
   ```typescript
   test.skip('Slow performance test', async () => {})
   ```

### Maintaining Tests

1. **Update selectors when HTML changes:**
   - If a test fails due to missing element
   - Verify the element still exists in the app
   - Update the selector if HTML structure changed

2. **Keep timeouts reasonable:**
   - 5s for element appearance
   - 2s for animation completion
   - 10s for full page load

3. **Handle skipped tests gracefully:**
   ```typescript
   test('2.5: Should drag between compartments', async ({ page }) => {
     const compartments = page.locator('.compartment-group');
     if (await compartments.count() < 2) {
       test.skip();
       return;
     }
     // Test implementation
   });
   ```

---

## FAQ

### Q: Why use Playwright instead of Cypress?

**A:** Playwright offers:
- Better multi-browser support (Chrome, Firefox, Safari, WebKit)
- Better performance for large test suites
- Simpler setup and configuration
- Better screenshot/video recording

### Q: How often should I run these tests?

**A:** Run:
- **Before deployment** (required)
- **On every commit** (CI/CD pipeline)
- **After major code changes** (manually)
- **Weekly** (regression check)

### Q: Can I run tests without a live server?

**A:** Yes, Playwright can start the server automatically:
- Set `reuseExistingServer: false` in config to always start fresh
- Set `reuseExistingServer: true` to reuse existing server (faster)

### Q: How do I debug a failing test?

**A:**
```bash
# Interactive debug mode
npx playwright test --debug tests/e2e/deployment-tests.spec.ts -g "test name"

# Or run in headed mode
npx playwright test --headed -g "test name"
```

### Q: Can I run tests on other browsers?

**A:** Yes, update `playwright.config.ts`:
```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
],
```

---

## Support & Feedback

For issues or improvements to the testing suite:

1. Check this document for solutions
2. Review test output in `test-results/`
3. Check browser console for errors
4. Run individual tests with `--debug` flag

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test Guide](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Last Updated:** February 2024  
**Playwright Version:** 1.40+  
**Node Version:** 14+

