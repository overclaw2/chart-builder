import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConveyorConfigService } from '../../core/services/conveyor-config.service';
import { ConveyorStateService } from '../../core/services/conveyor-state.service';
import {
  ConveyorConfig,
  Conveyor,
  ConveyorArea,
  PackageData,
  AllocationResult,
  UIState,
  AllocatedCell,
} from '../../core/models/conveyor.model';

@Component({
  selector: 'app-conveyor-cell-allocator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conveyor-cell-allocator.component.html',
  styleUrls: ['./conveyor-cell-allocator.component.css'],
})
export class ConveyorCellAllocatorComponent implements OnInit, OnDestroy {
  @Input() packageData: PackageData | null = null;
  @Output() allocationComplete = new EventEmitter<AllocationResult>();
  @Output() allocationCancelled = new EventEmitter<void>();

  // Configuration
  config: ConveyorConfig | null = null;
  conveyors: Conveyor[] = [];

  // UI State
  uiState: UIState = {
    mode: 'new',
    activeConveyor: null,
    activeArea: null,
    openSections: [],
    currentPackage: null as any,
    selectedCells: null,
  };

  // Calculated data
  selectedCellsInSection: { [sectionId: string]: number[] } = {};
  allocatedCellsMap: { [key: string]: AllocatedCell | null } = {};

  // UI Helpers
  showConfigUpload = false;
  configFileInput: HTMLInputElement | null = null;
  tooltipCell: { sectionId: string; cellIndex: number } | null = null;
  tooltipPosition: { x: number; y: number } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private configService: ConveyorConfigService,
    private stateService: ConveyorStateService
  ) {}

  ngOnInit(): void {
    this.configService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        this.config = config;
        if (config) {
          this.conveyors = config.conveyors;
          this.initializeUIState();
        }
      });

    // Load initial state if package is provided
    if (this.packageData) {
      this.uiState.currentPackage = this.packageData;
      this.detectMode();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize UI state based on package data
   */
  private initializeUIState(): void {
    if (!this.packageData) return;

    this.uiState.currentPackage = this.packageData;
    this.detectMode();

    if (this.uiState.mode === 'edit' && this.packageData.allocation) {
      this.autoNavigateEditMode();
    }
  }

  /**
   * Detect if this is a new allocation or edit existing
   */
  private detectMode(): void {
    if (this.packageData?.allocation) {
      this.uiState.mode = 'edit';
      this.uiState.originalAllocation = this.packageData.allocation;
    } else {
      this.uiState.mode = 'new';
    }
  }

  /**
   * Auto-navigate in edit mode
   */
  private autoNavigateEditMode(): void {
    const allocation = this.packageData?.allocation;
    if (!allocation) return;

    // Auto-select conveyor
    this.uiState.activeConveyor = allocation.conveyorId;

    // Auto-select area
    this.uiState.activeArea = allocation.areaId;

    // Auto-open all 4 sections
    const area = this.getArea(allocation.conveyorId, allocation.areaId);
    if (area) {
      const conveyorIndex = this.conveyors.findIndex(c => c.id === allocation.conveyorId);
      const areaIndex = this.conveyors[conveyorIndex]?.areas.findIndex(a => a.id === allocation.areaId);
      
      for (let i = 1; i <= 4; i++) {
        const sectionId = `${allocation.conveyorId}-${allocation.areaId}-${i}`;
        if (!this.uiState.openSections.includes(sectionId)) {
          this.uiState.openSections.push(sectionId);
        }
      }
    }

    // Highlight existing allocation
    this.selectedCellsInSection[allocation.sectionId] = allocation.cellIndices;
    this.uiState.selectedCells = {
      sectionId: allocation.sectionId,
      cellIndices: allocation.cellIndices,
    };
  }

  /**
   * Get area by conveyor and area IDs
   */
  private getArea(conveyorId: string, areaId: string): ConveyorArea | null {
    const conveyor = this.conveyors.find(c => c.id === conveyorId);
    return conveyor?.areas.find(a => a.id === areaId) ?? null;
  }

  /**
   * Handle conveyor selection
   */
  toggleConveyor(conveyorId: string): void {
    if (this.uiState.activeConveyor === conveyorId) {
      // Deselect
      this.uiState.activeConveyor = null;
      this.uiState.activeArea = null;
      this.uiState.openSections = [];
      this.selectedCellsInSection = {};
      this.uiState.selectedCells = null;
    } else {
      // Select new conveyor
      this.uiState.activeConveyor = conveyorId;
      this.uiState.activeArea = null;
      this.uiState.openSections = [];
      this.selectedCellsInSection = {};
      this.uiState.selectedCells = null;
    }
  }

  /**
   * Handle area selection
   */
  toggleArea(areaId: string): void {
    if (this.uiState.activeArea === areaId) {
      // Deselect
      this.uiState.activeArea = null;
      this.uiState.openSections = [];
      this.selectedCellsInSection = {};
      this.uiState.selectedCells = null;
    } else {
      // Select new area
      this.uiState.activeArea = areaId;
      this.uiState.openSections = [];
      this.selectedCellsInSection = {};
      this.uiState.selectedCells = null;
    }
  }

  /**
   * Handle section toggle (Level 3)
   */
  toggleSection(sectionId: string): void {
    const index = this.uiState.openSections.indexOf(sectionId);
    if (index > -1) {
      // Close section
      this.uiState.openSections.splice(index, 1);
      delete this.selectedCellsInSection[sectionId];
      
      // If this was the selected section, clear selection
      if (this.uiState.selectedCells?.sectionId === sectionId) {
        this.uiState.selectedCells = null;
      }
    } else {
      // Open section
      this.uiState.openSections.push(sectionId);
    }
  }

  /**
   * Get section label
   */
  getSectionLabel(conveyorId: string, areaId: string, sectionNumber: number): string {
    return `${areaId}${sectionNumber}`;
  }

  /**
   * Calculate section index width range
   */
  getSectionRange(areaStart: number, areaEnd: number, sectionNumber: number): { start: number; end: number } {
    return this.configService.calculateSectionRange(areaStart, areaEnd, sectionNumber);
  }

  /**
   * Get displayed index width labels
   */
  getIndexWidthLabels(
    areaStart: number,
    areaEnd: number
  ): { position: 'left' | 'right' | 'both'; start: number; end: number } {
    return {
      position: 'both',
      start: areaStart,
      end: areaEnd,
    };
  }

  /**
   * Get section ID
   */
  getSectionId(conveyorId: string, areaId: string, sectionNumber: number): string {
    return `${conveyorId}-${areaId}-${sectionNumber}`;
  }

  /**
   * Check if section is open
   */
  isSectionOpen(sectionId: string): boolean {
    return this.uiState.openSections.includes(sectionId);
  }

  /**
   * Get total cells
   */
  getTotalCells(): number {
    return this.config?.level4_config.total_cells || 45;
  }

  /**
   * Get cell width
   */
  getCellWidth(): number {
    return this.config?.level4_config.cell_width || 5;
  }

  /**
   * Calculate cell index width
   */
  calculateCellStartWidth(sectionStart: number, cellIndex: number): number {
    return sectionStart + cellIndex * this.getCellWidth();
  }

  /**
   * Handle cell click
   */
  onCellClick(sectionId: string, cellIndex: number): void {
    const allocated = this.getAllocatedCellInfo(sectionId, cellIndex);
    
    // Check if cell is occupied by another package
    if (allocated && allocated.packageId !== this.packageData?.id) {
      return; // Cannot select cell occupied by other package
    }

    // Check if cell is already in selection
    const currentSelection = this.selectedCellsInSection[sectionId] || [];
    const cellIndex2 = currentSelection.indexOf(cellIndex);

    if (cellIndex2 > -1) {
      // Cell is selected, deselect it
      currentSelection.splice(cellIndex2, 1);
    } else {
      // Try to select consecutive cells starting from this cell
      const needed = this.packageData?.cells || 1;
      const consecutive = this.findConsecutiveAvailableCells(sectionId, cellIndex, needed);
      
      if (consecutive.length === needed) {
        this.selectedCellsInSection[sectionId] = consecutive;
        this.uiState.selectedCells = {
          sectionId,
          cellIndices: consecutive,
        };
      }
    }

    this.updateSelectedCells();
  }

  /**
   * Find consecutive available cells
   */
  private findConsecutiveAvailableCells(sectionId: string, startIndex: number, count: number): number[] {
    const conveyorId = this.uiState.activeConveyor;
    if (!conveyorId) return [];

    return this.stateService.findConsecutiveAvailableCells(
      conveyorId,
      sectionId,
      startIndex,
      count,
      this.uiState.mode === 'edit' ? this.packageData?.id : undefined
    );
  }

  /**
   * Update selected cells
   */
  private updateSelectedCells(): void {
    // Find the first non-empty section selection
    for (const [sectionId, cells] of Object.entries(this.selectedCellsInSection)) {
      if (cells.length > 0) {
        this.uiState.selectedCells = {
          sectionId,
          cellIndices: cells,
        };
        return;
      }
    }
    this.uiState.selectedCells = null;
  }

  /**
   * Check if cell is in current selection
   */
  isCellSelected(sectionId: string, cellIndex: number): boolean {
    return this.selectedCellsInSection[sectionId]?.includes(cellIndex) ?? false;
  }

  /**
   * Get allocated cell info
   */
  getAllocatedCellInfo(sectionId: string, cellIndex: number): AllocatedCell | null {
    const conveyorId = this.uiState.activeConveyor;
    if (!conveyorId) return null;

    return this.stateService.getAllocatedCellInfo(conveyorId, sectionId, cellIndex);
  }

  /**
   * Get allocated cell color
   */
  getAllocatedCellColor(sectionId: string, cellIndex: number): string | null {
    const allocated = this.getAllocatedCellInfo(sectionId, cellIndex);
    return allocated?.color ?? null;
  }

  /**
   * Check if can select cell
   */
  canSelectCell(sectionId: string, cellIndex: number): boolean {
    const allocated = this.getAllocatedCellInfo(sectionId, cellIndex);
    if (!allocated) return true;
    // Can select if it's the current package's allocation
    return allocated.packageId === this.packageData?.id;
  }

  /**
   * Get cell tooltip content
   */
  getCellTooltip(sectionId: string, cellIndex: number): string {
    const conveyorId = this.uiState.activeConveyor;
    const areaId = this.uiState.activeArea;
    if (!conveyorId || !areaId) return '';

    const area = this.getArea(conveyorId, areaId);
    if (!area) return '';

    const sectionNumber = parseInt(sectionId.split('-')[2]);
    const sectionRange = this.getSectionRange(area.start, area.end, sectionNumber);
    const cellStart = this.calculateCellStartWidth(sectionRange.start, cellIndex);
    const cellEnd = cellStart + this.getCellWidth();

    const allocated = this.getAllocatedCellInfo(sectionId, cellIndex);
    if (allocated) {
      return `Cell ${cellIndex}: ${cellStart}-${cellEnd} [Mcm] (${allocated.packageName})`;
    }
    return `Cell ${cellIndex}: ${cellStart}-${cellEnd} [Mcm]`;
  }

  /**
   * Show tooltip
   */
  showTooltip(event: MouseEvent, sectionId: string, cellIndex: number): void {
    this.tooltipCell = { sectionId, cellIndex };
    this.tooltipPosition = {
      x: event.clientX + 10,
      y: event.clientY + 10,
    };
  }

  /**
   * Hide tooltip
   */
  hideTooltip(): void {
    this.tooltipCell = null;
    this.tooltipPosition = null;
  }

  /**
   * Check if allocate button should be enabled
   */
  isAllocateButtonEnabled(): boolean {
    if (!this.uiState.selectedCells || !this.packageData) {
      return false;
    }

    // Check if selection matches required cells
    if (this.uiState.selectedCells.cellIndices.length !== this.packageData.cells) {
      return false;
    }

    // In edit mode, check if selection is different from original
    if (this.uiState.mode === 'edit' && this.uiState.originalAllocation) {
      const isSame =
        this.uiState.originalAllocation.sectionId === this.uiState.selectedCells.sectionId &&
        JSON.stringify(this.uiState.originalAllocation.cellIndices) ===
          JSON.stringify(this.uiState.selectedCells.cellIndices);
      if (isSame) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handle allocate button click
   */
  onAllocate(): void {
    if (!this.isAllocateButtonEnabled() || !this.uiState.selectedCells || !this.packageData) {
      return;
    }

    const conveyorId = this.uiState.activeConveyor!;
    const sectionId = this.uiState.selectedCells.sectionId;
    const cellIndices = this.uiState.selectedCells.cellIndices;

    // Extract area ID from section ID
    const areaId = sectionId.split('-')[1];

    // Update state
    if (this.uiState.mode === 'edit' && this.uiState.originalAllocation) {
      this.stateService.updateAllocation(
        this.uiState.originalAllocation.conveyorId,
        this.packageData.id,
        conveyorId,
        sectionId,
        cellIndices,
        this.packageData
      );
    } else {
      this.stateService.allocateCells(conveyorId, sectionId, cellIndices, this.packageData);
    }

    // Emit result
    this.allocationComplete.emit({
      packageId: this.packageData.id,
      conveyorId,
      areaId,
      sectionId,
      cellIndices,
      success: true,
    });
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    this.allocationCancelled.emit();
  }

  /**
   * Handle config file upload
   */
  onConfigFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.configService.loadConfigFromFile(file).catch((error) => {
        alert(`Failed to load configuration: ${error.message}`);
      });
    }
  }

  /**
   * Get available areas for active conveyor
   */
  getAvailableAreas(): ConveyorArea[] {
    if (!this.uiState.activeConveyor) return [];
    const conveyor = this.conveyors.find(c => c.id === this.uiState.activeConveyor);
    return conveyor?.areas ?? [];
  }

  /**
   * Get area display label
   */
  getAreaLabel(areaId: string): string {
    return areaId;
  }
}
