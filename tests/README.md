# End-to-End Testing Suite

This directory contains the comprehensive post-deployment testing suite for the Chart Builder application.

## 📁 Structure

```
tests/
├── e2e/
│   └── deployment-tests.spec.ts    # Main E2E test file with 27 tests
├── test-utils.ts                    # Helper utilities for test reporting
└── README.md                         # This file
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:deployment
```

### Run Specific Test Category
```bash
# App loading tests only
npx playwright test -g "App Loading"

# Drag-drop tests only  
npx playwright test -g "Drag-Drop"

# Integration tests
npx playwright test -g "Integration"
```

### View Interactive Report
```bash
npx playwright show-report
```

## 📊 Test Coverage

The test suite covers:

✅ **App Loading (9 tests)**
- Component rendering
- DOM element verification
- Console error detection
- Screenshot capture

✅ **Drag-Drop Functionality (9 tests)**
- Available to container drag
- List updates
- Compartment interactions
- Visual feedback

✅ **Integration (4 tests)**
- Multi-operation workflows
- UI consistency
- Concurrent operations

✅ **Error Handling (3 tests)**
- Invalid operations
- Promise rejection handling
- Page recovery

✅ **Performance (2 tests)**
- Load time validation
- Operation responsiveness

## 📖 Documentation

See [../TESTING.md](../TESTING.md) for comprehensive documentation including:
- Detailed test descriptions
- Troubleshooting guide
- CI/CD integration examples
- Best practices

## 🔧 Configuration

Playwright configuration is in `playwright.config.ts` at project root:
- Runs on Chromium browser
- Takes screenshots on failure
- Captures traces for debugging
- Automatically starts dev server on localhost:4200

## 📸 Screenshots

Test execution generates screenshots in `test-results/screenshots/`:
- `01-home-screen.png` - Initial app state
- `02-drag-drop-placed.png` - After drag operation
- `03-compartment-operations.png` - Compartment interactions
- `04-lists-updated.png` - Updated lists after operations
- `05-final-state.png` - Final application state

## 📋 Reports

Generated after each test run:
- `test-results/results.json` - Raw test data
- `test-results/html/` - Interactive HTML report
- `deployment-report.md` - Markdown summary report

## 🛠️ Troubleshooting

### Tests won't run?
1. Ensure Node.js >= 14.x installed
2. Run `npm install` to get dependencies
3. Check `npm run start` works (dev server)

### Tests are timing out?
1. Check if app is loading slowly: `npm start`
2. Increase timeout in `playwright.config.ts`
3. Run with `--debug` flag to see what's happening

### Selectors not finding elements?
1. App structure may have changed
2. Update selectors in `deployment-tests.spec.ts`
3. Run in `--headed` mode to debug visually

## 📚 Learn More

- [Playwright Documentation](https://playwright.dev)
- [Full Testing Guide](../TESTING.md)
- [Project README](../README.md)

---

**Maintenance:** These tests are designed to be easily updated as the app evolves. Update test selectors when HTML structure changes, and add new tests as features are added.
