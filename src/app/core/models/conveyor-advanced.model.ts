/**
 * Advanced Conveyor Configuration with Cell-Level Details
 */

export interface ConveyorCell {
  index: number;
  centralWidthIndex: number;
  occupiedBy: string | null;
}

export interface ConveyorSection {
  name: string;
  startWidthIndex: number;
  stopWidthIndex: number;
  cells: ConveyorCell[];
}

export interface ConveyorAreaAdvanced {
  name: string;
  startWidthIndex: number;
  stopWidthIndex: number;
  Sections: ConveyorSection[];
}

export interface ConveyorAdvanced {
  conveyorId: string;
  conveyorName: string;
  Area: ConveyorAreaAdvanced[];
}

export interface ConveyorConfigAdvanced {
  convayor: ConveyorAdvanced[];
}
