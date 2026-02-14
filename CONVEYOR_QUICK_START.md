# Conveyor Cell Allocator - Quick Start Guide

## 5-Minute Setup

### Step 1: Verify Component Files
All files are in place:
```
✓ src/app/core/models/conveyor.model.ts
✓ src/app/core/services/conveyor-config.service.ts
✓ src/app/core/services/conveyor-state.service.ts
✓ src/app/features/conveyor-cell-allocator/
  ✓ conveyor-cell-allocator.component.ts
  ✓ conveyor-cell-allocator.component.html
  ✓ conveyor-cell-allocator.component.css
  ✓ conveyor-cell-allocator.component.spec.ts
✓ conveyor_config.json
```

### Step 2: Import Component in Your Module
```typescript
import { ConveyorCellAllocatorComponent } from './features/conveyor-cell-allocator/conveyor-cell-allocator.component';

// In app module or component's imports array:
imports: [ConveyorCellAllocatorComponent]
```

### Step 3: Add to Template
```html
<app-conveyor-cell-allocator
  [packageData]="selectedPackageData"
  (allocationComplete)="onAllocationComplete($event)"
  (allocationCancelled)="onAllocationCancelled()"
  *ngIf="showAllocator">
</app-conveyor-cell-allocator>
```

### Step 4: Handle Events in Component
```typescript
export class YourComponent {
  selectedPackageData: PackageData | null = null;
  showAllocator = false;

  openAllocator(item: Item) {
    // Convert Item to PackageData
    this.selectedPackageData = {
      id: item.id,
      name: item.name,
      category: 'Electronics',  // or item.destination
      width: item.dimensionMcm,
      cells: 5,  // Calculate based on your logic
      color: item.color || '#7dd3fc'
      // allocation will be auto-detected if exists
    };
    this.showAllocator = true;
  }

  onAllocationComplete(result: AllocationResult) {
    console.log('Allocated cells:', result);
    // Update your data
    this.showAllocator = false;
  }

  onAllocationCancelled() {
    console.log('Allocation cancelled');
    this.showAllocator = false;
  }
}
```

### Step 5: (Optional) Load Custom Config
```typescript
import { ConveyorConfigService } from './core/services/conveyor-config.service';

constructor(private configService: ConveyorConfigService) {}

loadCustomConfig(file: File) {
  this.configService.loadConfigFromFile(file)
    .then(() => console.log('Config loaded'))
    .catch(error => console.error('Config error:', error));
}

// Or load from object:
const config = {
  conveyors: [...],
  level4_config: { total_cells: 45, cell_width: 5 }
};
this.configService.loadConfigFromData(config);
```

## Usage Flows

### Flow 1: New Allocation
1. User clicks "🚚" on unallocated package
2. Allocator opens
3. User: Conveyor 1 → Area A → Section (Click B2) → Select cells 5-9
4. User clicks "Allocate"
5. Cells allocated, state saved, window closes

### Flow 2: Edit Allocation
1. User clicks "🚚" on already-allocated package
2. Allocator opens and auto-navigates:
   - Conveyor auto-selected
   - Area auto-selected
   - All 4 sections auto-open
   - Existing cells highlighted in blue
3. User can modify selection
4. User clicks "Allocate" to save changes
5. Old allocation removed, new one saved

## Configuration

### Default Config
The component loads a default configuration on startup. You can:
1. Use the default (2 conveyors with 4 areas each)
2. Click "⚙️ Config" button to upload custom JSON

### Custom Config Format
```json
{
  "conveyors": [
    {
      "id": "1",
      "name": "Conveyor 1",
      "areas": [
        {"id": "A", "start": 1000, "end": 1900},
        {"id": "B", "start": 1900, "end": 2800}
      ]
    }
  ],
  "level4_config": {
    "total_cells": 45,
    "cell_width": 5
  }
}
```

## Key Features

### Automatic
- ✅ Default configuration loaded
- ✅ State persisted to localStorage
- ✅ Auto-navigation in edit mode
- ✅ Overlap prevention
- ✅ Consecutive cell validation

### User Controls
- ✅ Load custom configuration (file upload)
- ✅ Navigate 4 levels: Conveyor → Area → Section → Cells
- ✅ Open multiple sections simultaneously
- ✅ Select required cells
- ✅ View allocated cells (colored by package)
- ✅ Allocate or cancel

### Visual Feedback
- ✅ Button highlighting (active state)
- ✅ Color-coded cells
- ✅ Hover tooltips (cell index and Mcm value)
- ✅ Enable/disable allocate button
- ✅ Package information display

## Testing

### Quick Manual Test
1. Open application in browser
2. Look for "🚚" button on any package
3. Click it - allocator should open
4. Select: Conveyor 1 → Area A → Click Section B1 button
5. Click cells 0-4 to select them
6. Click "Allocate" button
7. Window should close
8. Refresh page - allocation should persist

### Check State
Open browser DevTools → Application → Local Storage → Look for `conveyor_state` key

## Common Tasks

### Task 1: Allocate Package
```
1. Click "🚚" on package
2. Click Conveyor 1
3. Click Area B
4. Click Section (orange button e.g., B2)
5. Click cells to select
6. Click "Allocate"
```

### Task 2: Edit Allocation
```
1. Click "🚚" on allocated package
2. Sections auto-open, existing cells highlighted
3. Click different cells to change selection
4. Click "Allocate" to save
```

### Task 3: Upload Config
```
1. Click "⚙️ Config" button
2. Click "Choose File"
3. Select conveyor_config.json
4. UI updates with new configuration
```

### Task 4: Check Allocations
```
1. Open DevTools
2. Console → Type:
   JSON.parse(localStorage.getItem('conveyor_state'))
```

## Troubleshooting

### Issue: Config Button Not Working
- **Solution**: Verify conveyor_config.json file exists and is valid JSON
- **Check**: Browser console for error messages

### Issue: Allocate Button Disabled
- **Causes**:
  - Not enough cells selected (need exact count)
  - Cells overlap with other package
  - In edit mode with same selection
- **Solution**: Verify cell count matches package requirements

### Issue: State Not Persisting
- **Causes**:
  - localStorage disabled in browser
  - Private/incognito mode
- **Solution**: Check browser privacy settings

### Issue: No Sections Visible
- **Solution**: Click area button first, then click section toggle buttons

## API Reference

### Component Inputs
```typescript
@Input() packageData: PackageData | null
  // Package to allocate
  // Set to null to reset

@Input() config?: ConveyorConfig
  // Optional: provide custom config directly
```

### Component Outputs
```typescript
@Output() allocationComplete: EventEmitter<AllocationResult>
  // Fired when user clicks Allocate button
  
@Output() allocationCancelled: EventEmitter<void>
  // Fired when user clicks Cancel button
```

### AllocationResult
```typescript
{
  packageId: string;
  conveyorId: string;
  areaId: string;
  sectionId: string;
  cellIndices: number[];
  success: boolean;
}
```

## Data Persistence

### Where Data is Stored
- **Browser localStorage** under key: `conveyor_state`
- **Structure**: Map of conveyor IDs to their allocations
- **Persistence**: Survives page reload, cleared on localStorage reset

### Data Lifetime
- Allocations persist until:
  - User clears browser data
  - Application calls `ConveyorStateService.clearState()`
  - User reallocates package to different section

### Multi-User
If using on shared browser:
- Each user's allocations are mixed in same localStorage
- Consider implementing backend storage for production
- Add user ID prefix to storage keys if needed

## Performance Tips

1. **Lazy Load Component**: Only create allocator when button clicked
2. **Batch Updates**: Group multiple allocations before reload
3. **Clear Old State**: Periodically call `clearState()` for unused packages
4. **Optimize Config**: Keep conveyor_config.json under 100KB

## Next Steps

1. ✅ Verify component files exist
2. ✅ Import component in your module
3. ✅ Add to template
4. ✅ Handle output events
5. ✅ Test allocation flow
6. ✅ Customize config if needed
7. ✅ Style to match app design
8. ✅ Deploy to production

## Support Resources

- **Complete Guide**: CONVEYOR_ALLOCATOR_README.md
- **Technical Details**: CONVEYOR_ALLOCATOR_IMPLEMENTATION.md
- **Sample Config**: conveyor_config.json
- **Unit Tests**: conveyor-cell-allocator.component.spec.ts

---

**Ready to use!** The Conveyor Cell Allocator is fully implemented and ready for integration.

For detailed documentation, see the complete README file.
