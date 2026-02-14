# Conveyor Cell Allocator - Implementation Guide

## Overview

The Conveyor Cell Allocator is a comprehensive interactive system for managing cell allocations across multiple conveyors. It provides a 4-level hierarchical interface for users to allocate package cells to conveyor sections with visual feedback and state persistence.

## Features

### Core Functionality
✅ **4-Level Hierarchical Navigation**
- Level 1: Conveyor selection (dynamic from JSON)
- Level 2: Area selection (dynamic index width ranges)
- Level 3: Section selection (4 equal divisions)
- Level 4: Cell grid for allocation (dynamic cells count)

✅ **Two Operating Modes**
- **NEW**: User navigates and selects cells for unallocated packages
- **EDIT**: Auto-navigate to existing allocation, allow modification

✅ **State Persistence**
- Track all allocated cells using localStorage
- Prevent overlaps with other packages
- Support multi-package workflows

✅ **Dynamic Configuration**
- Load conveyor_config.json with custom conveyors, areas, and level4 settings
- No hardcoded values - fully configurable
- Support for varying numbers of conveyors and areas

✅ **Visual Features**
- Dynamic button generation based on configuration
- Index width labels (avoid duplication at boundaries)
- Color-coded cells (package colors for allocated)
- Hover tooltips with cell indices
- Enable/disable Allocate button based on valid selection
- Modal window with Cancel/Allocate buttons

✅ **Auto-Navigation in Edit Mode**
- Auto-select conveyor where package is allocated
- Auto-select area
- Auto-open all 4 sections
- Highlight existing allocation in blue

## File Structure

```
chart-builder/
├── src/app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── conveyor.model.ts          # Data models
│   │   │   └── container.model.ts         # Updated Item interface
│   │   └── services/
│   │       ├── conveyor-config.service.ts # Configuration management
│   │       └── conveyor-state.service.ts  # State persistence
│   └── features/
│       └── conveyor-cell-allocator/
│           ├── conveyor-cell-allocator.component.ts
│           ├── conveyor-cell-allocator.component.html
│           ├── conveyor-cell-allocator.component.css
│           └── conveyor-cell-allocator.component.spec.ts
├── conveyor_config.json                   # Sample configuration
├── CONVEYOR_ALLOCATOR_README.md           # This file
├── CONVEYOR_ALLOCATOR_IMPLEMENTATION.md   # Technical details
└── CONVEYOR_QUICK_START.md               # Quick start guide
```

## Services

### ConveyorConfigService
Handles JSON configuration loading and provides configuration data.

**Key Methods:**
- `loadConfigFromFile(file)` - Load configuration from file
- `loadConfigFromData(configData)` - Load configuration from data object
- `getConfig()` - Get current configuration
- `getConveyor(conveyorId)` - Get specific conveyor
- `getArea(conveyorId, areaId)` - Get specific area
- `calculateSectionRange()` - Calculate section index width range
- `calculateCellIndexWidth()` - Calculate cell's Mcm value
- `getTotalCells()` - Get total cell count from config
- `getCellWidth()` - Get cell width from config

**Observable:**
- `config$` - Configuration observable

### ConveyorStateService
Manages allocation state and provides persistence via localStorage.

**Key Methods:**
- `getConveyorState(conveyorId)` - Get state for a conveyor
- `isCellAllocated()` - Check if cell is allocated
- `getAllocatedCellInfo()` - Get cell info if allocated
- `getSectionAllocations()` - Get all cells in a section
- `findConsecutiveAvailableCells()` - Find available consecutive cells
- `allocateCells()` - Allocate cells for a package
- `deallocateCells()` - Remove allocation for a package
- `updateAllocation()` - Update package allocation
- `findPackageAllocation()` - Find where package is allocated
- `clearState()` - Clear all allocations

**Observable:**
- `state$` - State change observable

## Models

### PackageData
```typescript
interface PackageData {
  id: string;
  name: string;
  category: string;
  width: number;        // Mcm
  cells: number;        // Cells required
  color: string;        // Hex color
  allocation?: {        // Optional: existing allocation
    conveyorId: string;
    areaId: string;
    sectionId: string;
    cellIndices: number[];
  };
}
```

### ConveyorConfig
```typescript
interface ConveyorConfig {
  conveyors: [
    {
      id: string;
      name: string;
      areas: [
        {
          id: string;
          start: number;   // Mcm
          end: number;     // Mcm
        }
      ];
    }
  ];
  level4_config: {
    total_cells: number;  // Default: 45
    cell_width: number;   // Default: 5 (Mcm)
  };
}
```

## JSON Configuration Format

See `conveyor_config.json` for a complete example.

```json
{
  "conveyors": [
    {
      "id": "1",
      "name": "Conveyor 1",
      "areas": [
        {
          "id": "A",
          "start": 1000,
          "end": 1900
        }
      ]
    }
  ],
  "level4_config": {
    "total_cells": 45,
    "cell_width": 5
  }
}
```

## Integration with Main App

### 1. Import Component
```typescript
import { ConveyorCellAllocatorComponent } from './features/conveyor-cell-allocator/conveyor-cell-allocator.component';

// In your component
imports: [ConveyorCellAllocatorComponent]
```

### 2. Add Component to Template
```html
<app-conveyor-cell-allocator
  [packageData]="selectedPackage"
  (allocationComplete)="handleAllocationComplete($event)"
  (allocationCancelled)="handleAllocationCancelled()"
  *ngIf="showAllocator">
</app-conveyor-cell-allocator>
```

### 3. Handle Events
```typescript
handleAllocationComplete(result: AllocationResult) {
  console.log('Allocation complete:', result);
  // Update package with allocation
  // Close allocator window
}

handleAllocationCancelled() {
  // Close allocator window
  this.showAllocator = false;
}
```

### 4. Open Allocator from Package Button
```typescript
onConveyorAllocate(item: Item) {
  // Convert Item to PackageData
  const packageData: PackageData = {
    id: item.id,
    name: item.name,
    category: item.destination,  // or appropriate field
    width: item.dimensionMcm,
    cells: 5,  // Or calculate from item properties
    color: item.color || '#7dd3fc',
    // allocation will be null for new allocation
    // or populated if package already has allocation
  };

  this.selectedPackage = packageData;
  this.showAllocator = true;
}
```

## Usage Flow

### Flow A: New Allocation
1. User has unallocated package in main app
2. User clicks "🚚" button on package
3. Allocator window opens in NEW mode
4. User selects: Conveyor → Area → Section(s) → Cells
5. User clicks "Allocate"
6. State is saved, window closes
7. Package is now allocated

### Flow B: Edit Allocation
1. User clicks "🚚" button on allocated package
2. Allocator opens in EDIT mode
3. Auto-navigation happens:
   - Conveyor is auto-selected
   - Area is auto-selected
   - All 4 sections are auto-opened
   - Existing allocation is highlighted in blue
4. User can modify selection
5. User clicks "Allocate" to save new selection
6. Old allocation removed, new one saved

## UI Colors and Styling

- **Active Conveyor (Level 1)**: #1976d2 (blue)
- **Active Area (Level 2)**: #1976d2 (blue)
- **Active Section (Level 3)**: #f57c00 (orange)
- **Selected Cells (Level 4)**: #1976d2 (blue)
- **Available Cells**: #e0e0e0 (light gray)
- **Allocated Cells**: Package's color
- **Allocate Button Enabled**: #1976d2 (blue)
- **Allocate Button Disabled**: #cccccc (gray)

## Cell Selection Logic

### Contiguous Selection
- Cells must be consecutive (no gaps)
- Selection starts from clicked cell
- Selection stops when hitting allocated cell (of other package)

### Validation
- Selection count must match package's required cells
- Cannot overlap with OTHER packages (except in edit mode for same package)
- Can include current package's cells (when editing)

### Example
- Package requires 5 cells
- User clicks cell 10
- System selects cells 10-14 (if available)
- Selection is valid, Allocate button enabled

## State Persistence

State is stored in localStorage under key `conveyor_state`.

Structure:
```typescript
{
  "1": {
    "conveyorId": "1",
    "allocations": [
      {
        "sectionId": "1-A-1",
        "cells": [
          {
            "index": 0,
            "packageId": "pkg-1",
            "packageName": "Package 1",
            "category": "Electronics",
            "color": "#ff0000"
          }
        ]
      }
    ]
  }
}
```

## Testing

Run tests with:
```bash
ng test
```

Test file: `conveyor-cell-allocator.component.spec.ts`

Tests cover:
- Component initialization
- Configuration loading
- Mode detection (new vs edit)
- UI state changes
- Cell selection
- Allocation button state
- Allocation completion

## Troubleshooting

### Config Not Loading
- Check conveyor_config.json is valid JSON
- Verify file is in project root
- Check browser console for errors

### State Not Persisting
- Check localStorage is enabled
- Check browser console for storage errors
- Clear localStorage and reload

### Cells Not Selectable
- Verify cells aren't already allocated to other packages
- Check section is open (Level 3 section button clicked)
- Verify package data has correct `cells` count

### Allocate Button Disabled
- Check cell selection matches package's required cells
- In edit mode, ensure selection is different from original
- Verify conveyor/area is selected

## Future Enhancements

- [ ] Drag-and-drop cell selection
- [ ] Undo/Redo functionality
- [ ] Multi-package batch allocation
- [ ] Export/Import allocation states
- [ ] Visualization of conveyor utilization
- [ ] Advanced search and filtering
- [ ] Mobile-optimized interface
- [ ] Real-time state synchronization

## Technical Notes

- **Framework**: Angular 14+
- **Language**: TypeScript
- **State Management**: RxJS + localStorage
- **Storage**: Browser localStorage (no backend required)
- **Standalone**: True (uses standalone components)
- **Responsive**: Yes (works on desktop and tablet)
- **Accessibility**: ARIA labels included
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Support and Documentation

- **Quick Start**: See CONVEYOR_QUICK_START.md
- **Implementation Details**: See CONVEYOR_ALLOCATOR_IMPLEMENTATION.md
- **Sample Config**: See conveyor_config.json

## License

Part of the Chart Builder application.
