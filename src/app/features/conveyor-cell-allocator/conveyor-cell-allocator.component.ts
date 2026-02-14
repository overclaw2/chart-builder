import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConveyorAdvancedService } from '../../core/services/conveyor-advanced.service';
import { ConveyorStateService } from '../../core/services/conveyor-state.service';
import {
  ConveyorConfigAdvanced,
  ConveyorAdvanced,
  ConveyorAreaAdvanced,
  ConveyorSection,
} from '../../core/models/conveyor-advanced.model';
import {
  PackageData,
  AllocationResult,
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
  config: ConveyorConfigAdvanced | null = null;
  conveyors: ConveyorAdvanced[] = [];

  // UI State
  uiState = {
    mode: 'new' as 'new' | 'edit',
    activeConveyor: null as string | null,
    activeArea: null as string | null,
    openSections: [] as string[],
    currentPackage: null as PackageData | null,
    selectedCells: null as { sectionId: string; cellIndices: number[] } | null,
    originalAllocation: null as any,
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

  // Expose configService for template access
  configService: ConveyorAdvancedService;

  constructor(
    configService: ConveyorAdvancedService,
    private stateService: ConveyorStateService
  ) {
    this.configService = configService;
  }

  ngOnInit(): void {
    this.configService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        this.config = config;
        if (config) {
          this.conveyors = config.convayor || [];
          this.initializeUIState();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize UI state based on package data
   */
  private initializeUIState(): void {
    // Select the first conveyor by default if available
    if (this.conveyors && this.conveyors.length > 0 && !this.uiState.activeConveyor) {
      this.uiState.activeConveyor = this.conveyors[0].conveyorId;
    }

    if (!this.packageData) return;

    this.uiState.currentPackage = this.packageData;
    this.detectMode();

    // In NEW mode, reset all expansion state
    if (this.uiState.mode === 'new') {
      this.resetAllExpansionState();
    } else if (this.uiState.mode === 'edit' && this.packageData.allocation) {
      // In EDIT mode, auto-navigate to existing allocation
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
   * Reset all expansion state - used for NEW mode
   * Ensures all areas and sections start collapsed
   */
  private resetAllExpansionState(): void {
    this.uiState.activeArea = null;
    this.uiState.openSections = [];
    this.selectedCellsInSection = {};
    this.uiState.selectedCells = null;
  }

  /**
   * Auto-navigate in edit mode
   */
  private autoNavigateEditMode(): void {
    const allocation = this.packageData?.allocation;
    if (!allocation) return;

    // Auto-select conveyor
    this.uiState.activeConveyor = allocation.conveyorId;

    // Auto-select area (use areaId which is the area name in advanced format)
    this.uiState.activeArea = allocation.areaId;

    // Auto-open section if exists
    const section = this.configService.getSection(allocation.conveyorId, allocation.areaId, allocation.sectionId);
    if (section) {
      if (!this.uiState.openSections.includes(allocation.sectionId)) {
        this.uiState.openSections.push(allocation.sectionId);
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
   * Get area by conveyor and area name
   */
  private getArea(conveyorId: string, areaName: string): ConveyorAreaAdvanced | null {
    const conveyor = this.conveyors.find(c => c.conveyorId === conveyorId);
    return conveyor?.Area.find(a => a.name === areaName) ?? null;
  }

  /**
   * Handle conveyor tab selection
   * Switches to the specified conveyor and resets all Level 2-4 selections
   */
  selectConveyorTab(conveyorId: string): void {
    // Only proceed if changing to a different conveyor
    if (this.uiState.activeConveyor === conveyorId) {
      return;
    }
    
    // Switch to the selected conveyor
    this.uiState.activeConveyor = conveyorId;
    
    // Reset all Level 2-4 selections when changing conveyors
    this.resetAllExpansionState();
  }

  /**
   * Reset all selections below the current level
   * Used when switching conveyors or areas
   */
  private resetLevelSelectionsBelow(): void {
    this.uiState.activeArea = null;
    this.uiState.openSections = [];
    this.selectedCellsInSection = {};
    this.uiState.selectedCells = null;
  }

  /**
   * Handle conveyor selection (kept for backward compatibility)
   */
  toggleConveyor(conveyorId: string): void {
    this.selectConveyorTab(conveyorId);
  }

  /**
   * Handle area selection
   */
  toggleArea(areaId: string): void {
    if (this.uiState.activeArea === areaId) {
      // Deselect
      this.uiState.activeArea = null;
    } else {
      // Select new area
      this.uiState.activeArea = areaId;
    }
    // Reset sections and cell selections when area changes
    this.uiState.openSections = [];
    this.selectedCellsInSection = {};
    this.uiState.selectedCells = null;
  }

  /**
   * Handle section toggle (Level 3)
   */
  toggleSection(sectionName: string): void {
    const index = this.uiState.openSections.indexOf(sectionName);
    if (index > -1) {
      // Close section
      this.uiState.openSections.splice(index, 1);
      delete this.selectedCellsInSection[sectionName];
      
      // If this was the selected section, clear selection
      if (this.uiState.selectedCells?.sectionId === sectionName) {
        this.uiState.selectedCells = null;
      }
    } else {
      // Open section
      this.uiState.openSections.push(sectionName);
    }
  }

  /**
   * Get section label (section name)
   */
  getSectionLabel(section: ConveyorSection): string {
    return section.name;
  }

  /**
   * Get section range from section object (no calculation needed)
   */
  getSectionRange(section: ConveyorSection): { start: number; end: number } {
    return {
      start: section.startWidthIndex,
      end: section.stopWidthIndex,
    };
  }

  /**
   * Get displayed index width labels for area
   */
  getIndexWidthLabels(
    area: ConveyorAreaAdvanced
  ): { position: 'left' | 'right' | 'both'; start: number; end: number } {
    return {
      position: 'both',
      start: area.startWidthIndex,
      end: area.stopWidthIndex,
    };
  }

  /**
   * Get section ID from section name
   */
  getSectionId(section: ConveyorSection): string {
    return section.name;
  }

  /**
   * Check if section is open
   */
  isSectionOpen(sectionId: string): boolean {
    return this.uiState.openSections.includes(sectionId);
  }

  /**
   * Get total cells - from first section of first area of first conveyor
   */
  getTotalCells(): number {
    const firstSection = this.conveyors[0]?.Area[0]?.Sections[0];
    return firstSection?.cells.length || 45;
  }

  /**
   * Get cell width by calculating from first cell
   */
  getCellWidth(): number {
    const firstSection = this.conveyors[0]?.Area[0]?.Sections[0];
    if (!firstSection || firstSection.cells.length < 2) return 5;
    return firstSection.cells[1].centralWidthIndex - firstSection.cells[0].centralWidthIndex;
  }

  /**
   * Get cell central width index (already calculated in data)
   */
  getCellCentralWidth(section: ConveyorSection, cellIndex: number): number {
    const cell = section.cells.find(c => c.index === cellIndex);
    return cell?.centralWidthIndex || 0;
  }

  /**
   * Handle cell click
   */
  onCellClick(sectionName: string, cellIndex: number): void {
    const allocated = this.getAllocatedCellInfo(sectionName, cellIndex);
    
    // Check if cell is occupied by another package
    if (allocated && allocated.packageId !== this.packageData?.id) {
      return; // Cannot select cell occupied by other package
    }

    // Check if cell is already in selection
    const currentSelection = this.selectedCellsInSection[sectionName] || [];
    const cellIndexPosition = currentSelection.indexOf(cellIndex);

    if (cellIndexPosition > -1) {
      // Cell is selected, deselect it
      currentSelection.splice(cellIndexPosition, 1);
    } else {
      // Try to select consecutive cells starting from this cell
      const needed = this.packageData?.cells || 1;
      const consecutive = this.findConsecutiveAvailableCells(sectionName, cellIndex, needed);
      
      if (consecutive.length === needed) {
        this.selectedCellsInSection[sectionName] = consecutive;
        this.uiState.selectedCells = {
          sectionId: sectionName,
          cellIndices: consecutive,
        };
      }
    }

    this.updateSelectedCells();
  }

  /**
   * Find consecutive available cells
   */
  private findConsecutiveAvailableCells(sectionName: string, startIndex: number, count: number): number[] {
    const conveyorId = this.uiState.activeConveyor;
    const areaName = this.uiState.activeArea;
    if (!conveyorId || !areaName) return [];

    const section = this.configService.getSection(conveyorId, areaName, sectionName);
    if (!section) return [];

    // Find consecutive cells starting from startIndex
    const result: number[] = [];
    const sortedCells = [...section.cells].sort((a, b) => a.index - b.index);
    const startCell = sortedCells.find(c => c.index === startIndex);
    if (!startCell) return [];

    const startPos = sortedCells.indexOf(startCell);
    for (let i = startPos; i < startPos + count && i < sortedCells.length; i++) {
      const cell = sortedCells[i];
      // Check if cell is available (not occupied or owned by current package)
      if (cell.occupiedBy === null || (this.uiState.mode === 'edit' && cell.occupiedBy === this.packageData?.id)) {
        result.push(cell.index);
      } else {
        break; // Stop if cell is occupied by another package
      }
    }

    return result.length === count ? result : [];
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
  isCellSelected(sectionName: string, cellIndex: number): boolean {
    return this.selectedCellsInSection[sectionName]?.includes(cellIndex) ?? false;
  }

  /**
   * Get allocated cell info
   */
  getAllocatedCellInfo(sectionName: string, cellIndex: number): AllocatedCell | null {
    const conveyorId = this.uiState.activeConveyor;
    if (!conveyorId) return null;

    return this.stateService.getAllocatedCellInfo(conveyorId, sectionName, cellIndex);
  }

  /**
   * Get allocated cell color
   */
  getAllocatedCellColor(sectionName: string, cellIndex: number): string | null {
    const allocated = this.getAllocatedCellInfo(sectionName, cellIndex);
    return allocated?.color ?? null;
  }

  /**
   * Check if can select cell
   */
  canSelectCell(sectionName: string, cellIndex: number): boolean {
    const allocated = this.getAllocatedCellInfo(sectionName, cellIndex);
    if (!allocated) return true;
    // Can select if it's the current package's allocation
    return allocated.packageId === this.packageData?.id;
  }

  /**
   * Get cell tooltip content
   */
  getCellTooltip(section: ConveyorSection, cellIndex: number): string {
    const cellCentral = this.getCellCentralWidth(section, cellIndex);
    const cellWidth = this.getCellWidth();
    const cellStart = cellCentral - cellWidth / 2;
    const cellEnd = cellCentral + cellWidth / 2;

    const allocated = this.getAllocatedCellInfo(section.name, cellIndex);
    if (allocated) {
      return `Cell ${cellIndex}: ${cellStart.toFixed(1)}-${cellEnd.toFixed(1)} [Mcm] (${allocated.packageName})`;
    }
    return `Cell ${cellIndex}: ${cellStart.toFixed(1)}-${cellEnd.toFixed(1)} [Mcm]`;
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
    const areaId = this.uiState.activeArea!;

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
  getAvailableAreas(): ConveyorAreaAdvanced[] {
    if (!this.uiState.activeConveyor) return [];
    const conveyor = this.conveyors.find(c => c.conveyorId === this.uiState.activeConveyor);
    return conveyor?.Area ?? [];
  }

  /**
   * Get area display label (using area name)
   */
  getAreaLabel(areaName: string): string {
    return areaName;
  }

  /**
   * Get formatted section range display
   */
  getSectionRangeDisplay(section: ConveyorSection): string {
    return `${section.startWidthIndex}-${section.stopWidthIndex}`;
  }

  /**
   * Get cell indices array for ngFor iteration
   */
  getCellIndicesArray(section: ConveyorSection): number[] {
    return section.cells.map(c => c.index);
  }

  /**
   * Get section ID (section name)
   */
  getSectionIdForTemplate(section: ConveyorSection): string {
    return section.name;
  }

  /**
   * Get cell background color based on selection and allocation state
   */
  getCellBackgroundColor(sectionName: string, cellIndex: number): string {
    if (this.isCellSelected(sectionName, cellIndex)) {
      return '#1976d2';
    }
    const allocatedColor = this.getAllocatedCellColor(sectionName, cellIndex);
    return allocatedColor || '#e0e0e0';
  }

  /**
   * Get cell text color
   */
  getCellTextColor(sectionName: string, cellIndex: number): string {
    return this.isCellSelected(sectionName, cellIndex) ? '#fff' : '#333';
  }

  /**
   * Check if section is open (already defined above, keeping for backward compatibility)
   */
  isCellClickable(sectionId: string): boolean {
    return this.isSectionOpen(sectionId);
  }

  /**
   * Handle cell button click - integrates section open check and click handler
   */
  handleCellClick(sectionName: string, cellIndex: number): void {
    if (this.isCellClickable(sectionName)) {
      this.onCellClick(sectionName, cellIndex);
    }
  }
}
