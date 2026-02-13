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
}

export interface Compartment {
  id: string;
  index: number; // 1 or 2
  widthindexStart: number;
  widthindexEnd: number;
  widthMcm: number;
  widthUtilization: number; // percentage
  weightKg: number;
  weightUtilization: number; // percentage
  items: Item[];
  totalCapacity: number;
  backgroundColor?: string; // Color of the compartment bar (TODO 3)
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
