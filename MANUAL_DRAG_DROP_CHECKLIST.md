# Manual Drag-Drop Testing Checklist

**Post-Deployment Verification**  
After each deployment, run these manual tests to verify drag-drop functionality is working correctly.

---

## Test Setup
- [ ] App is running at http://localhost:4200
- [ ] No console errors visible (F12 → Console tab)
- [ ] Home screen loaded properly

---

## Test 1: Drag Package from Available Packages to Container

**Steps:**
1. Look at "Available Packages" list on the left side
2. Click and hold on any package
3. Drag it to a specific compartment (e.g., Compartment A in Container 1)
4. Release the mouse (drop)

**Verify:**
- [ ] Package **visually appears on the container chart** at the drop location
- [ ] Package **disappears from Available Packages list**
- [ ] Package **appears in Placed Packages list**
- [ ] Package position is reasonable (not off-screen or outside compartment bounds)
- [ ] Container weight/utilization updates

**Screenshot:** Capture the final state showing package on container + updated lists

---

## Test 2: Drag Package Between Compartments in Same Container

**Setup:** Ensure at least 2 packages are placed in the same container in different compartments

**Steps:**
1. Click and hold on a placed package in Container 1, Compartment A
2. Drag it to Compartment B (different compartment, same container)
3. Release (drop)

**Verify:**
- [ ] Package **moves visually** from Compartment A to Compartment B
- [ ] Package is now displayed in Compartment B location
- [ ] Compartment A and B both update their weight/utilization
- [ ] **Placed Packages list** shows the update (if applicable)
- [ ] No duplication of package

**Screenshot:** Capture showing package in new compartment + updated metrics

---

## Test 3: Drag Package Between Different Containers

**Setup:** Ensure 2 containers exist and at least 1 package is placed in Container 1

**Steps:**
1. Click and hold on a placed package in Container 1
2. Drag it to a compartment in Container 2
3. Release (drop)

**Verify:**
- [ ] Package **moves from Container 1 to Container 2** visually
- [ ] Container 1 weight/utilization **decreases**
- [ ] Container 2 weight/utilization **increases**
- [ ] Package is gone from Container 1 compartment
- [ ] Package appears in Container 2 compartment
- [ ] **Placed Packages list** reflects the change
- [ ] No console errors during operation

**Screenshot:** Capture showing packages in both containers + updated metrics

---

## Test 4: Verify Available & Placed Packages Lists Update Properly

**Steps:**
1. Note the count in "Available Packages" list
2. Perform 2-3 drag operations (Test 1 scenarios)
3. Check list counts after each operation

**Verify:**
- [ ] **Available Packages count decreases** when packages are dragged to containers
- [ ] **Placed Packages count increases** when packages are dragged to containers
- [ ] **Available Packages count increases** when packages are removed from containers (if removal feature exists)
- [ ] **Placed Packages count decreases** when packages are removed
- [ ] List items visually match the counts
- [ ] No duplicate packages in either list

**Screenshot:** Capture lists after several operations showing accurate counts

---

## Test 5: Drag Multiple Packages Sequentially

**Steps:**
1. Drag package 1 to Container 1, Compartment A
2. Drag package 2 to Container 1, Compartment B
3. Drag package 3 to Container 2, Compartment A
4. Move package 1 to Container 2

**Verify:**
- [ ] All 4 operations succeed
- [ ] Each package displays correctly at final location
- [ ] No packages are lost or duplicated
- [ ] Lists remain consistent
- [ ] Container weights are accurate

**Screenshot:** Capture final state with multiple packages across containers

---

## Pass/Fail Criteria

✅ **PASS** if:
- All packages render visually after drag-drop
- Available/Placed lists update correctly
- No cross-container drag issues
- No console errors
- Weights/utilization update correctly

❌ **FAIL** if:
- Package disappears after drop but doesn't appear on chart
- Lists don't update
- Package duplicates
- Console has JavaScript errors
- App crashes or becomes unresponsive

---

## Troubleshooting

**Package disappears after drop:**
- Check browser console for errors
- Verify compartment has valid widthindex range
- Try dragging to different compartment

**Lists don't update:**
- Refresh page (F5) and try again
- Check if package data was actually added to containers
- Look for console errors

**Drag doesn't work at all:**
- Verify app is fully loaded
- Check if mouse events are being captured
- Try different browser (Chrome vs Firefox)
- Clear browser cache and reload

---

## Deployment Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**Browser:** _________________  

All tests passed: ☐ YES ☐ NO

**Notes:** ________________________________________________________________________________

---

**Post Results:** Take screenshots and add to deployment report with pass/fail status.
