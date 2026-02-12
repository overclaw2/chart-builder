export interface Item {
  id: string;
  name: string;
  dimensionMcm: number;
  weightKg: number;
  destination: string;
  position: number; // start position in container
  length: number; // length in container
}

export interface Container {
  id: string;
  name: string;
  ship: string;
  widthindexStart: number;
  widthindexEnd: number;
  widthMcm: number;
  widthUtilization: number; // percentage
  weightKg: number;
  weightUtilization: number; // percentage
  items: Item[];
  totalCapacity: number;
}

export interface ShipData {
  title: string;
  containers: Container[];
}
