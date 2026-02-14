# 🧪 Testing Quick Reference Card

**Print this page for quick access to common testing commands!**

## ⚡ Most Common Commands

```bash
# Run all deployment tests (recommended)
npm run test:deployment

# Run all E2E tests (without report generation)
npm run test:e2e

# View last test report
npm run test:report

# Debug a failing test
npm run test:e2e:debug
```

## 📊 Test Categories

| Category | Tests | Command | Status |
|----------|-------|---------|--------|
| App Loading | 9 | `npx playwright test -g "App Loading"` | ✅ |
| Drag-Drop | 9 | `npx playwright test -g "Drag-Drop"` | ✅ |
| Integration | 4 | `npx playwright test -g "Integration"` | ✅ |
| Error Handling | 3 | `npx playwright test -g "Error Handling"` | ✅ |
| Performance | 2 | `npx playwright test -g "Performance"` | ✅ |
| **TOTAL** | **27** | - | ✅ |

## 🎯 Running Specific Tests

```bash
# Single test by number
npx playwright test -g "1.1"

# By name
npx playwright test -g "Should load the application"

# By describe block
npx playwright test -g "App Loading"
```

## 👁️ Viewing Results

```bash
# Interactive HTML report
npm run test:report

# Markdown deployment report
cat deployment-report.md

# Screenshots directory
ls -la test-results/screenshots/

# Raw JSON results
cat test-results/results.json | jq .
```

## 🔧 Test Modes

| Mode | Command | Use Case |
|------|---------|----------|
| Normal | `npm run test:e2e` | Run tests headless |
| Headed | `npm run test:e2e:headed` | See browser window |
| Debug | `npm run test:e2e:debug` | Interactive debugging |
| Headed+Debug | `npx playwright test --headed --debug` | Visual debugging |

## 📸 Generated Artifacts

After running tests, you'll get:
- `test-results/screenshots/` - 5 PNG screenshots
- `test-results/html/` - Interactive HTML report
- `test-results/results.json` - Raw test data
- `deployment-report.md` - Markdown summary

## 🚨 Troubleshooting

### Tests won't run?
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install

# Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Dev server won't start?
```bash
# Check if it starts manually
npm start

# Should see: "Compiled successfully"
```

### Selector not found?
```bash
# Run in headed mode to see what's happening
npx playwright test --headed -g "test name"

# Or debug mode
npx playwright test --debug -g "test name"
```

### Timeout errors?
1. Increase timeout in `playwright.config.ts`
2. Check if app is loading slowly: `npm start`
3. Run in headed mode to debug

## 📋 Pre-Deployment Checklist

- [ ] Run: `npm run test:deployment`
- [ ] Check all tests pass
- [ ] Review: `cat deployment-report.md`
- [ ] Verify screenshots look correct
- [ ] Check `test-results/results.json` has `expected: 27, passed: 27`

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `tests/e2e/deployment-tests.spec.ts` | All 27 tests |
| `playwright.config.ts` | Configuration |
| `scripts/run-deployment-tests.js` | Test runner script |
| `TESTING.md` | Complete guide (read this!) |
| `TEST_SETUP.md` | Setup documentation |
| `deployment-report.md` | Latest test report |

## 🌐 Test Environment

- **URL:** http://localhost:4200
- **Browser:** Chromium (Chrome)
- **Dev Server:** Starts automatically
- **Auto-reload:** Yes (when tests finish)

## 💡 Pro Tips

```bash
# Run only failed tests from last run
npx playwright test --last-failed

# Run specific test file
npx playwright test tests/e2e/deployment-tests.spec.ts

# Run with custom reporter
npx playwright test --reporter=list

# Show trace from failed test
npx playwright show-trace test-results/trace.zip

# List all available tests
npx playwright test --list
```

## 📚 Full Documentation

For comprehensive information:
- `TESTING.md` - 21KB complete testing guide
- `TEST_SETUP.md` - Setup architecture
- `tests/README.md` - Tests directory overview

## ✅ Deployment Ready?

If all 27 tests pass ✅:
- App loads correctly
- Drag-drop works
- State updates properly
- Error handling works
- Performance is good
- **YOU'RE READY TO DEPLOY! 🚀**

## 🆘 Need Help?

1. Check `TESTING.md` for detailed guidance
2. Run test in debug mode: `npm run test:e2e:debug`
3. Check console output for errors
4. Review screenshots in `test-results/screenshots/`
5. Check test-results/results.json for detailed failure info

---

**Print me for quick reference!** 📄
