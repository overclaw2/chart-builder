export interface Item {
  id: string;
  name: string;
  dimensionMcm: number;
  weightKg: number;
  destination: string;
  position: number; // start position in compartment
  length: number; // length in compartment
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
}

export interface Container {
  id: string;
  name: string;
  ship: string;
  compartments: Compartment[];
}

export interface ShipData {
  title: string;
  containers: Container[];
}
