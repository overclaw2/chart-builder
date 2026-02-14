/**
 * Conveyor Configuration and State Models
 */

// Level 4 Detail: Individual cell within a section
export interface ConveyorCell {
  index: number;
  centralWidthIndex: number; // Central Mcm position of cell
  occupiedBy: string | null; // null or packageId
}

// Level 3 Detail: Section within an area
export interface ConveyorSection {
  name: string;
  startWidthIndex: number;
  stopWidthIndex: number;
  cells?: ConveyorCell[]; // Optional: detailed cells array
}

// Level 2: Area within a conveyor (can have simplified OR detailed format)
export interface ConveyorArea {
  name: string;
  startWidthIndex: number;
  stopWidthIndex: number;
  Sections?: ConveyorSection[]; // Detailed format with sections
  // Simplified format
  id?: string;
  start?: number;
  end?: number;
}

export interface Conveyor {
  conveyorId: string;
  conveyorName: string;
  Areas: ConveyorArea[];
  // Backward compat
  id?: string;
  name?: string;
  areas?: ConveyorArea[];
}

export interface Level4Config {
  total_cells?: number;
  cell_width?: number; // Mcm - default 5
}

export interface ConveyorConfig {
  conveyors: Conveyor[];
  level4_config?: Level4Config; // Optional - can infer from detailed data
}

export interface AllocatedCell {
  index: number;
  packageId: string;
  packageName: string;
  category: string;
  color: string;
}

export interface SectionAllocation {
  sectionId: string;
  cells: AllocatedCell[];
}

export interface ConveyorState {
  conveyorId: string;
  allocations: SectionAllocation[];
}

export interface PackageData {
  id: string;
  name: string;
  category: string;
  width: number; // Mcm
  cells: number; // Number of cells required
  color: string; // Hex color code
  allocation?: {
    conveyorId: string;
    areaId: string;
    sectionId: string;
    cellIndices: number[];
  };
}

export interface AllocationRequest {
  packageData: PackageData;
  mode: 'new' | 'edit';
}

export interface AllocationResult {
  packageId: string;
  conveyorId: string;
  areaId: string;
  sectionId: string;
  cellIndices: number[];
  success: boolean;
}

export interface UIState {
  mode: 'new' | 'edit';
  activeConveyor: string | null;
  activeArea: string | null;
  openSections: string[];
  currentPackage: PackageData;
  selectedCells: {
    sectionId: string;
    cellIndices: number[];
  } | null;
  originalAllocation?: {
    conveyorId: string;
    areaId: string;
    sectionId: string;
    cellIndices: number[];
  };
}
