# Chart Builder - Test Setup Documentation

This document describes the complete post-deployment testing suite setup and architecture.

## 🎯 Overview

The Chart Builder project includes a comprehensive E2E testing suite using Playwright that verifies:
- ✅ Application loads correctly
- ✅ Core drag-drop functionality works
- ✅ UI state updates properly
- ✅ Error handling is robust
- ✅ Performance is acceptable

## 📦 Installation

### Step 1: Install Playwright
```bash
npm install --save-dev @playwright/test
```

### Step 2: Verify Installation
```bash
npx playwright --version
```

### Step 3: Install Chromium Browser (if needed)
```bash
npx playwright install chromium
```

## 🏗️ Architecture

### Project Structure
```
chart-builder/
├── playwright.config.ts                  # Playwright configuration
├── tests/
│   ├── README.md                         # Tests directory overview
│   ├── e2e/
│   │   └── deployment-tests.spec.ts      # All 27 E2E tests
│   └── test-utils.ts                     # Test reporting utilities
├── scripts/
│   └── run-deployment-tests.js           # Test runner script
├── test-results/                         # Generated after test run
│   ├── screenshots/                      # Test screenshots (PNG)
│   ├── html/                             # Interactive HTML report
│   ├── reports/                          # Markdown reports
│   └── results.json                      # Raw test data (JSON)
├── TESTING.md                            # Comprehensive testing guide
├── TEST_SETUP.md                         # This file
├── deployment-report-template.md         # Report template
├── deployment-report.md                  # Latest generated report
└── package.json                          # Updated with test scripts
```

## 🔧 Configuration Files

### playwright.config.ts
Main Playwright configuration:
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporters: [
    ['html'],
    ['json'],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },
});
```

**Key Features:**
- Tests run in parallel for speed
- Automatically starts dev server
- Takes screenshots on test failure
- Captures traces for debugging
- Generates HTML and JSON reports

### package.json Scripts
New test scripts added:
```json
{
  "test:deployment": "node scripts/run-deployment-tests.js",
  "test:e2e": "npx playwright test",
  "test:e2e:debug": "npx playwright test --debug",
  "test:e2e:headed": "npx playwright test --headed",
  "test:report": "npx playwright show-report test-results/html"
}
```

## 📊 Test Suite (27 Tests Total)

### Test File: tests/e2e/deployment-tests.spec.ts

#### 1. App Loading Tests (9 tests)
Tests that verify the application initializes correctly.

**Tests:**
- 1.1: Application URL loading
- 1.2: Container visualization element
- 1.3: Available packages panel
- 1.4: Placed packages list
- 1.5: Container cards
- 1.6: Console error checking
- 1.7: Home screen screenshot
- 1.8: Header/title visibility
- 1.9: Toolbar controls visibility

**Selectors Used:**
```typescript
'.container-visualization'      // Main app container
'.available-packages-panel'     // Available items panel
'.side-panel'                   // Placed items panel
'.container-card'               // Container elements
'.title'                        // Page title
'.upload-section'               // Control buttons
```

#### 2. Drag-Drop Functionality Tests (9 tests)
Tests that verify the core drag-and-drop feature.

**Tests:**
- 2.1: Drag package from available to container
- 2.2: Available packages list decreases
- 2.3: Placed packages list increases
- 2.4: Drag-drop screenshot capture
- 2.5: Drag between compartments
- 2.6: Compartment operations screenshot
- 2.7: Package removal from container
- 2.8: Drag visual feedback
- 2.9: List updates screenshot

**Key Selectors:**
```typescript
'.package-item'                 // Available packages
'.container-bar'                // Drop target area
'.item'                         // Placed packages
'.side-panel .list-item'        // Placed packages list
```

#### 3. Integration Tests (4 tests)
Tests that verify multiple features work together.

**Tests:**
- 3.1: UI consistency after multiple operations
- 3.2: Search/filter with drag operations
- 3.3: Rapid consecutive drags
- 3.4: Final state screenshot

#### 4. Error Handling Tests (3 tests)
Tests that verify graceful error handling.

**Tests:**
- 4.1: Invalid drag operations
- 4.2: Unhandled promise rejections
- 4.3: Page navigation/reload

#### 5. Performance Tests (2 tests)
Tests that verify acceptable performance.

**Tests:**
- 5.1: Page load time (< 10 seconds)
- 5.2: Drag operation time (< 5 seconds)

## 🚀 Running Tests

### Option 1: Complete Test Suite with Report
```bash
npm run test:deployment
```
This script:
1. Runs all 27 tests
2. Collects test results
3. Gathers screenshots
4. Generates deployment report
5. Creates HTML report
6. Shows summary in console

**Output:**
- `test-results/screenshots/` - 5 PNG screenshots
- `test-results/html/` - Interactive HTML report
- `test-results/reports/` - Markdown reports
- `deployment-report.md` - Latest report (symlink)

### Option 2: Direct Playwright Test Execution
```bash
npm run test:e2e
```

### Option 3: Run Specific Tests
```bash
# App loading tests only
npx playwright test -g "App Loading"

# Drag-drop tests
npx playwright test -g "Drag-Drop"

# Single test
npx playwright test tests/e2e/deployment-tests.spec.ts -g "1.1"
```

### Option 4: Debug Mode
```bash
npm run test:e2e:debug
```
Starts interactive debugger where you can:
- Step through test code
- Inspect elements
- Run commands in console
- Resume execution

### Option 5: Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```
Opens browser window and shows test execution.

### Option 6: View Report
```bash
npm run test:report
```
Opens interactive HTML report from last test run.

## 📸 Screenshots Generated

Tests automatically generate up to 5 screenshots:

1. **01-home-screen.png** - Initial app state
2. **02-drag-drop-placed.png** - After drag operation
3. **03-compartment-operations.png** - Compartment interactions
4. **04-lists-updated.png** - Updated lists
5. **05-final-state.png** - Final state

**Location:** `test-results/screenshots/`

**When Captured:**
- Tests capture screenshots at specific points
- Screenshots on failure are automatic
- Full page screenshots are captured

## 📋 Test Results & Reports

### Files Generated
```
test-results/
├── screenshots/               # 5 PNG test screenshots
│   ├── 01-home-screen.png
│   ├── 02-drag-drop-placed.png
│   ├── 03-compartment-operations.png
│   ├── 04-lists-updated.png
│   └── 05-final-state.png
├── html/                      # Interactive HTML report
│   ├── index.html
│   ├── test-results-*.json
│   └── resources/
├── reports/                   # Markdown reports
│   └── deployment-report-YYYY-MM-DD.md
└── results.json               # Raw test data (JSON)
```

### Viewing Results

**HTML Report (Interactive):**
```bash
npm run test:report
```
Shows:
- Test execution timeline
- Pass/fail status for each test
- Screenshots from failures
- Video recordings (if enabled)
- Duration for each test

**Markdown Report:**
```bash
cat deployment-report.md
```
Shows:
- Executive summary
- Pass/fail counts
- Detailed test results
- Screenshots embedded/linked
- Deployment readiness status

**Raw Data:**
```bash
cat test-results/results.json | jq .
```
Raw Playwright test data in JSON format.

## 🔌 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Deployment Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

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
    
    - name: Run tests
      run: npm run test:deployment
      env:
        CI: true
    
    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
test:deployment:
  image: mcr.microsoft.com/playwright:v1.40.1
  script:
    - npm ci
    - npm run test:deployment
  artifacts:
    paths:
      - test-results/
    expire_in: 30 days
```

## 🛠️ Customization

### Adding New Tests

1. Edit `tests/e2e/deployment-tests.spec.ts`
2. Add new test in appropriate describe block:

```typescript
test('1.10: Should test new feature', async ({ page }) => {
  // Setup
  await page.goto('/');
  
  // Act
  const element = page.locator('.new-feature');
  
  // Assert
  await expect(element).toBeVisible();
  
  // Screenshot
  await page.screenshot({
    path: 'test-results/screenshots/new-feature.png'
  });
});
```

3. Run tests to verify:
```bash
npx playwright test tests/e2e/deployment-tests.spec.ts -g "new feature"
```

### Updating Selectors

If app HTML structure changes and tests fail:

1. Find the new selector for the element
2. Update it in `deployment-tests.spec.ts`:

```typescript
// Old
const element = page.locator('.old-class');

// New
const element = page.locator('.new-class');
```

3. Rerun tests:
```bash
npm run test:e2e
```

### Adjusting Timeouts

If tests timeout (especially in CI/slow networks):

Edit `playwright.config.ts`:

```typescript
use: {
  navigationTimeout: 30000,  // Increase from 30s
  actionTimeout: 10000,      // Increase from 30s
  timeout: 60000,            // Global timeout
},
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `TESTING.md` | Comprehensive testing guide (21KB) |
| `TEST_SETUP.md` | This setup documentation |
| `tests/README.md` | Tests directory overview |
| `deployment-report-template.md` | Report template reference |
| `deployment-report.md` | Latest generated report |

## 🔍 Troubleshooting

### Tests Won't Run
```bash
# Check Node version
node --version  # Should be 14+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Install Playwright browsers
npx playwright install
```

### Dev Server Won't Start
```bash
# Make sure Angular CLI is installed
npm install --save-dev @angular/cli

# Test dev server manually
npm start
# Should see "Compiled successfully" message
```

### Selectors Not Found
1. Run with `--headed` to see what's happening:
   ```bash
   npx playwright test --headed -g "test name"
   ```

2. Debug specific test:
   ```bash
   npx playwright test --debug -g "test name"
   ```

3. Check if HTML structure changed and update selectors

### Tests Timeout on CI
1. Increase timeout in `playwright.config.ts`
2. Disable parallel: `workers: 1`
3. Check CI logs for app startup issues

See [TESTING.md](./TESTING.md#troubleshooting) for more troubleshooting.

## 📈 Maintenance

### Regular Tasks

**Weekly:**
- Run tests: `npm run test:deployment`
- Review test results
- Address any failures

**Monthly:**
- Review test coverage
- Update selectors if app changed
- Check for new features to test

**Per Release:**
- Run full test suite before release
- Capture baseline screenshots
- Generate deployment report

## ✅ Pre-Deployment Checklist

Before deploying the application:

- [ ] Run full test suite: `npm run test:deployment`
- [ ] Check deployment report: `cat deployment-report.md`
- [ ] Review screenshots for visual correctness
- [ ] All 27 tests passing
- [ ] No critical console errors
- [ ] Performance acceptable (load < 10s)
- [ ] Manual smoke tests in target environment (optional)

## 📞 Support

For issues or questions:

1. Check [TESTING.md](./TESTING.md) - Comprehensive guide
2. Review test output in `test-results/`
3. Check browser console in headed mode: `npx playwright test --headed`
4. Debug with: `npx playwright test --debug`

## 🔗 Useful Links

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debug Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**Version:** 1.0  
**Last Updated:** February 2024  
**Playwright Version:** 1.40+  
**Node Version:** 14+  

For detailed testing information, see [TESTING.md](./TESTING.md).
