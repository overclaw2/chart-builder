export interface Item {
  id: string;
  name: string;
  dimensionMcm: number;
  weightKg: number;
  destination: string;
  position: number; // start position in compartment (index value)
  length: number; // length in compartment
  displayIndex?: number; // index to display below item (for Ofer's requirement)
  color?: string; // color for item visualization (default: #7dd3fc)
  sourcePackageId?: string; // tracks which available package this item came from (for syncing state)
  materialType?: string; // material type (default: custom for user-defined packages)
  containerId?: string; // ID of container this item belongs to
  compartmentId?: string; // ID of compartment this item belongs to
  location?: string; // display location string (e.g., "Container Name (1/2)")
}

export interface MaterialType {
  type: string;
  weightKg: number;
  dimensionMcm: number;
}

export interface Compartment {
  id: string;
  index: number; // 1 or 2
  widthindexStart: number;
  widthindexEnd: number;
  widthMcm: number;
  widthUtilization: number; // percentage
  weightUtilization: number; // percentage
  items: Item[];
  totalCapacity: number;
  backgroundColor?: string; // Color of the compartment bar (TODO 3)
  weightThreshold?: number; // Max weight % to trigger warning (default: 90%)
  widthThreshold?: number; // Max width % to trigger warning (default: 90%)
  warningLevel?: 'none' | 'yellow' | 'red' | 'danger'; // Current warning state
}

export interface Container {
  id: string;
  name: string;
  ship: string;
  compartments: Compartment[];
  orderIndex?: number; // Position in the container list for custom ordering
}

export interface ShipData {
  title: string;
  containers: Container[];
}
