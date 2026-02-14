import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  ConveyorState, 
  SectionAllocation, 
  AllocatedCell, 
  PackageData 
} from '../models/conveyor.model';

@Injectable({
  providedIn: 'root'
})
export class ConveyorStateService {
  private stateMap = new Map<string, ConveyorState>();
  private stateSubject = new BehaviorSubject<Map<string, ConveyorState>>(this.stateMap);
  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.loadStateFromStorage();
  }

  /**
   * Load state from localStorage
   */
  private loadStateFromStorage(): void {
    try {
      const stored = localStorage.getItem('conveyor_state');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, ConveyorState>;
        this.stateMap.clear();
        Object.entries(data).forEach(([key, value]) => {
          this.stateMap.set(key, value);
        });
        this.stateSubject.next(this.stateMap);
      }
    } catch (error) {
      console.warn('Failed to load conveyor state from storage:', error);
    }
  }

  /**
   * Save state to localStorage
   */
  private saveStateToStorage(): void {
    try {
      const data: Record<string, ConveyorState> = {};
      this.stateMap.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem('conveyor_state', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save conveyor state to storage:', error);
    }
  }

  /**
   * Get state for a specific conveyor
   */
  getConveyorState(conveyorId: string): ConveyorState {
    if (!this.stateMap.has(conveyorId)) {
      this.stateMap.set(conveyorId, {
        conveyorId,
        allocations: [],
      });
    }
    return this.stateMap.get(conveyorId)!;
  }

  /**
   * Check if a cell is allocated
   */
  isCellAllocated(conveyorId: string, sectionId: string, cellIndex: number): boolean {
    const state = this.getConveyorState(conveyorId);
    const allocation = state.allocations.find(a => a.sectionId === sectionId);
    return allocation?.cells.some(c => c.index === cellIndex) ?? false;
  }

  /**
   * Get allocated cell info if it exists
   */
  getAllocatedCellInfo(conveyorId: string, sectionId: string, cellIndex: number): AllocatedCell | null {
    const state = this.getConveyorState(conveyorId);
    const allocation = state.allocations.find(a => a.sectionId === sectionId);
    return allocation?.cells.find(c => c.index === cellIndex) ?? null;
  }

  /**
   * Get all allocated cells in a section
   */
  getSectionAllocations(conveyorId: string, sectionId: string): AllocatedCell[] {
    const state = this.getConveyorState(conveyorId);
    return state.allocations.find(a => a.sectionId === sectionId)?.cells ?? [];
  }

  /**
   * Find consecutive available cells starting from a position
   */
  findConsecutiveAvailableCells(
    conveyorId: string,
    sectionId: string,
    startIndex: number,
    count: number,
    excludePackageId?: string // For edit mode, exclude this package's cells from the "occupied" check
  ): number[] {
    const state = this.getConveyorState(conveyorId);
    const allocation = state.allocations.find(a => a.sectionId === sectionId);
    const allocatedCells = allocation?.cells ?? [];

    const selectedCells: number[] = [];
    let currentIndex = startIndex;

    while (selectedCells.length < count && currentIndex < 45) {
      const cellInfo = allocatedCells.find(c => c.index === currentIndex);
      
      // Check if cell is available
      if (!cellInfo) {
        // Cell is free
        selectedCells.push(currentIndex);
      } else if (excludePackageId && cellInfo.packageId === excludePackageId) {
        // Cell is occupied by the same package (in edit mode), allow selection
        selectedCells.push(currentIndex);
      } else {
        // Cell is occupied by another package, stop selection
        break;
      }
      
      currentIndex++;
    }

    return selectedCells.length === count ? selectedCells : [];
  }

  /**
   * Allocate cells for a package
   */
  allocateCells(
    conveyorId: string,
    sectionId: string,
    cellIndices: number[],
    packageData: PackageData
  ): boolean {
    const state = this.getConveyorState(conveyorId);
    let allocation = state.allocations.find(a => a.sectionId === sectionId);

    if (!allocation) {
      allocation = {
        sectionId,
        cells: [],
      };
      state.allocations.push(allocation);
    }

    // Add new cells
    for (const index of cellIndices) {
      allocation.cells.push({
        index,
        packageId: packageData.id,
        packageName: packageData.name,
        category: packageData.category,
        color: packageData.color,
      });
    }

    this.saveStateToStorage();
    this.stateSubject.next(this.stateMap);
    return true;
  }

  /**
   * Deallocate cells for a package
   */
  deallocateCells(conveyorId: string, packageId: string): void {
    const state = this.getConveyorState(conveyorId);
    
    for (const allocation of state.allocations) {
      allocation.cells = allocation.cells.filter(c => c.packageId !== packageId);
    }

    // Remove empty allocations
    state.allocations = state.allocations.filter(a => a.cells.length > 0);

    this.saveStateToStorage();
    this.stateSubject.next(this.stateMap);
  }

  /**
   * Update package allocation
   * Removes old allocation and creates new one
   */
  updateAllocation(
    oldConveyorId: string,
    oldPackageId: string,
    newConveyorId: string,
    newSectionId: string,
    newCellIndices: number[],
    packageData: PackageData
  ): boolean {
    // Remove old allocation if it exists
    if (oldConveyorId) {
      this.deallocateCells(oldConveyorId, oldPackageId);
    }

    // Add new allocation
    return this.allocateCells(newConveyorId, newSectionId, newCellIndices, packageData);
  }

  /**
   * Find package's current allocation
   */
  findPackageAllocation(packageId: string): {
    conveyorId: string;
    areaId?: string;
    sectionId: string;
    cellIndices: number[];
  } | null {
    for (const [conveyorId, state] of this.stateMap) {
      for (const allocation of state.allocations) {
        const cells = allocation.cells.filter(c => c.packageId === packageId);
        if (cells.length > 0) {
          return {
            conveyorId,
            sectionId: allocation.sectionId,
            cellIndices: cells.map(c => c.index),
          };
        }
      }
    }
    return null;
  }

  /**
   * Clear all state (for testing or reset)
   */
  clearState(): void {
    this.stateMap.clear();
    localStorage.removeItem('conveyor_state');
    this.stateSubject.next(this.stateMap);
  }
}
