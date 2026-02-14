/**
 * Conveyor Configuration and State Models
 */

export interface ConveyorArea {
  id: string;
  start: number; // Mcm
  end: number; // Mcm
}

export interface Conveyor {
  id: string;
  name: string;
  areas: ConveyorArea[];
}

export interface Level4Config {
  total_cells: number;
  cell_width: number; // Mcm
}

export interface ConveyorConfig {
  conveyors: Conveyor[];
  level4_config: Level4Config;
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
