import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ContainerService } from '../../core/services/container.service';
import { UndoRedoService } from '../../core/services/undo-redo.service';
import { HelpService } from '../../core/services/help.service';
import { ShipData, Container, Item, Compartment } from '../../core/models/container.model';
import { AvailablePackagesComponent } from '../available-packages/available-packages.component';
import { BulkImportComponent } from '../bulk-import/bulk-import.component';
import { HistoryViewerComponent } from '../history-viewer/history-viewer.component';
import { HelpPanelComponent } from '../help-panel/help-panel.component';
import { TourOverlayComponent } from '../tour-overlay/tour-overlay.component';

@Component({
  selector: 'app-container-visualization',
  standalone: true,
  imports: [CommonModule, FormsModule, AvailablePackagesComponent, BulkImportComponent, HistoryViewerComponent, HelpPanelComponent, TourOverlayComponent],
  templateUrl: './container-visualization.component.html',
  styleUrls: ['./container-visualization.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)', maxHeight: '0' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '1000px' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)', maxHeight: '0' }))
      ])
    ])
  ]
})
export class ContainerVisualizationComponent implements OnInit {
  shipData: ShipData | null = null;
  draggedItem: { containerId: string; compartmentId: string; item: Item } | null = null;
  dragOverCompartmentId: string | null = null;
  loadingMessage: string | null = null;
  dragTooltip: { index: number; visible: boolean; startIndex?: number; stopIndex?: number } = { index: 0, visible: false };
  hoveredItemId: string | null = null;
  isDragging: boolean = false;
  grabOffset: number = 0; // Offset between mouse position and item's left edge when grab occurs
  contextMenu: { visible: boolean; x: number; y: number; containerId: string; compartmentId: string; itemId: string } = {
    visible: false,
    x: 0,
    y: 0,
    containerId: '',
    compartmentId: '',
    itemId: ''
  };
  // TODO 4: Track if tooltip should show above or below item
  tooltipPositioning: { [itemId: string]: 'above' | 'below' } = {};
  
  // Remove item functionality
  draggedPlacedItem: { containerId: string; compartmentId: string; item: Item } | null = null;
  dragOverRemoveZone: boolean = false;
  dragOverAvailableZone: boolean = false;

  // Available packages panel state
  isAvailablePackagesPanelCollapsed: boolean = false;
  draggedAvailablePackage: Item | null = null;

  // Side panel collapse state
  isSidePanelCollapsed: boolean = false;

  // Search area collapse state
  isSearchCollapsed: boolean = false;

  // Reference to available packages component to sync state
  @ViewChild(AvailablePackagesComponent) availablePackagesComponent!: AvailablePackagesComponent;

  // TASK 5: Conv popup modal state
  convPopup: { visible: boolean; item: Item | null } = { visible: false, item: null };

  // Tooltip positioning for fixed/overlay mode
  tooltipState: { visible: boolean; x: number; y: number; item: Item | null } = { 
    visible: false, 
    x: 0, 
    y: 0, 
    item: null 
  };
  
  // Track initial tooltip position during drag to keep it fixed below package
  initialTooltipY: number = 0;

  // Ghost highlight for package being dragged (follows cursor on timeline strip)
  ghostHighlight: { left: string; width: string } | null = null;

  // TASK 2 - SEARCH: Search query state
  searchQuery: string = '';
  filteredShipData: ShipData | null = null;
  
  // TASK 2 - SEARCH FILTERS
  searchFilters = {
    name: '',
    destination: '',
    id: '',
    weightMin: '',
    weightMax: '',
    dimensionMin: '',
    dimensionMax: ''
  };

  // NEW: Undo/Redo History
  historyViewerOpen: boolean = false;
  previousStateBeforeDrag: ShipData | null = null;

  // NEW: Help System
  helpPanelOpen: boolean = false;

  constructor(
    private containerService: ContainerService, 
    private cdr: ChangeDetectorRef,
    private undoRedoService: UndoRedoService,
    private helpService: HelpService
  ) {}

  ngOnInit(): void {
    this.containerService.getShipData().subscribe((data) => {
      this.shipData = data;
      this.applyFilters();
    });
  }

  // TASK 2 - SEARCH & FILTER METHODS
  applyFilters(): void {
    if (!this.shipData) {
      this.filteredShipData = null;
      return;
    }

    // Deep clone the ship data to avoid modifying the original
    const filtered: ShipData = JSON.parse(JSON.stringify(this.shipData));

    // Apply filters to all containers and their compartments
    filtered.containers = filtered.containers.map((container) => {
      return {
        ...container,
        compartments: container.compartments.map((compartment) => {
          return {
            ...compartment,
            items: compartment.items.filter((item) => this.matchesFilters(item))
          };
        })
      };
    });

    this.filteredShipData = filtered;
    this.cdr.markForCheck();
  }

  matchesFilters(item: Item): boolean {
    // Check name filter
    if (this.searchFilters.name.trim()) {
      if (!item.name.toLowerCase().includes(this.searchFilters.name.toLowerCase())) {
        return false;
      }
    }

    // Check destination filter
    if (this.searchFilters.destination.trim()) {
      if (!item.destination.toLowerCase().includes(this.searchFilters.destination.toLowerCase())) {
        return false;
      }
    }

    // Check ID filter
    if (this.searchFilters.id.trim()) {
      if (!item.id.toLowerCase().includes(this.searchFilters.id.toLowerCase())) {
        return false;
      }
    }

    // Check weight range
    if (this.searchFilters.weightMin.trim()) {
      const minWeight = parseFloat(this.searchFilters.weightMin);
      if (!isNaN(minWeight) && item.weightKg < minWeight) {
        return false;
      }
    }
    if (this.searchFilters.weightMax.trim()) {
      const maxWeight = parseFloat(this.searchFilters.weightMax);
      if (!isNaN(maxWeight) && item.weightKg > maxWeight) {
        return false;
      }
    }

    // Check dimension range
    if (this.searchFilters.dimensionMin.trim()) {
      const minDimension = parseFloat(this.searchFilters.dimensionMin);
      if (!isNaN(minDimension) && (item.dimensionMcm || 0) < minDimension) {
        return false;
      }
    }
    if (this.searchFilters.dimensionMax.trim()) {
      const maxDimension = parseFloat(this.searchFilters.dimensionMax);
      if (!isNaN(maxDimension) && (item.dimensionMcm || 0) > maxDimension) {
        return false;
      }
    }

    return true;
  }

  onSearchFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchFilters = {
      name: '',
      destination: '',
      id: '',
      weightMin: '',
      weightMax: '',
      dimensionMin: '',
      dimensionMax: ''
    };
    this.applyFilters();
  }

  // Helper method to get filtered ship data for display
  getDisplayShipData(): ShipData | null {
    return this.filteredShipData || this.shipData;
  }

  // Count total filtered items
  getTotalFilteredItems(): number {
    if (!this.filteredShipData) return 0;
    let count = 0;
    this.filteredShipData.containers.forEach((container) => {
      container.compartments.forEach((compartment) => {
        count += compartment.items.length;
      });
    });
    return count;
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return Object.values(this.searchFilters).some((value) => value.trim() !== '');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.loadingMessage = '📤 Loading...';

    this.containerService
      .loadDataFromFile(file)
      .then(() => {
        this.loadingMessage = '✅ Data loaded successfully!';
        setTimeout(() => {
          this.loadingMessage = null;
        }, 3000);
        // Reset file input
        input.value = '';
      })
      .catch((error) => {
        this.loadingMessage = `❌ Error: ${error.message}`;
        setTimeout(() => {
          this.loadingMessage = null;
        }, 5000);
        input.value = '';
      });
  }

  onResetToMock(): void {
    this.containerService.resetToMockData();
    this.loadingMessage = '🔄 Reset to mock data';
    setTimeout(() => {
      this.loadingMessage = null;
    }, 2000);
  }

  getItemPosition(item: Item, compartment: Compartment): { left: string; width: string } {
    // Use widthindex range (not totalCapacity) for position calculation
    const compartmentRangeStart = compartment.widthindexStart;
    const compartmentRangeEnd = compartment.widthindexEnd;
    const compartmentRangeSize = compartmentRangeEnd - compartmentRangeStart;
    
    // Item position is in absolute widthindex coordinates
    const itemStart = item.position;
    // Use dimensionMcm for actual item width, scaled to match the compartment range
    const itemDimension = item.dimensionMcm || 27;
    const itemEnd = item.position + itemDimension;
    
    // Calculate position relative to compartment's widthindex range
    let leftPercent = ((itemStart - compartmentRangeStart) / compartmentRangeSize) * 100;
    let widthPercent = ((itemDimension) / compartmentRangeSize) * 100;

    // FIX: Ensure item is always visible - handle cross-compartment moves
    // If item start is before compartment start, adjust position
    if (itemStart < compartmentRangeStart) {
      // Item starts before compartment - show from left edge
      const visibleWidth = itemEnd - compartmentRangeStart;
      leftPercent = 0;
      widthPercent = (visibleWidth / compartmentRangeSize) * 100;
    } else if (itemStart > compartmentRangeEnd) {
      // Item starts after compartment - show at right edge with minimum width
      leftPercent = 100;
      widthPercent = 5; // Minimum width to keep visible
    } else {
      // Item starts within compartment - normal calculation
      leftPercent = ((itemStart - compartmentRangeStart) / compartmentRangeSize) * 100;
      widthPercent = ((itemDimension) / compartmentRangeSize) * 100;
    }
    
    // Clamp left position to 0-100%
    leftPercent = Math.max(0, Math.min(100, leftPercent));
    
    // Ensure minimum width visibility BEFORE edge adjustment
    widthPercent = Math.max(3, Math.min(100, widthPercent));
    
    // Adjust right edge if item extends beyond compartment
    if (leftPercent + widthPercent > 100) {
      widthPercent = 100 - leftPercent;
      // FIX: If width became 0 or negative after adjustment, restore minimum width
      // This prevents items from disappearing when positioned at compartment edges
      if (widthPercent <= 0) {
        widthPercent = 3;
        // Shift item left to ensure it stays visible
        leftPercent = Math.max(0, 100 - widthPercent);
      }
    }
    
    // Final safety check: ensure width is never 0
    if (widthPercent <= 0) {
      widthPercent = 3;
    }

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  }

  onDragStart(
    event: DragEvent,
    containerId: string,
    compartmentId: string,
    item: Item
  ): void {
    // UNDO/REDO: Capture state before drag operation
    this.capturePreviousState();

    this.draggedItem = { containerId, compartmentId, item };
    this.isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.dragTooltip.visible = true;

    // Calculate grab offset: where on the item (in pixels) the user clicked relative to the item's left edge
    const itemElement = event.target as HTMLElement;
    const itemRect = itemElement.getBoundingClientRect();
    const mouseXInItem = event.clientX - itemRect.left;
    const itemWidthPixels = itemRect.width;
    
    // Store grab offset as a fraction (0 = left edge, 1 = right edge)
    // This will be used during drop to maintain the exact grab point
    this.grabOffset = mouseXInItem / itemWidthPixels;

    // TASK 2 ENHANCEMENT FIX: Set initial tooltip position below the package (will be fixed during drag)
    // Position tooltip 15px below the package bottom
    const tooltipX = itemRect.left + itemRect.width / 2;
    const tooltipY = itemRect.bottom + 15;
    
    this.initialTooltipY = tooltipY;
    this.tooltipState = {
      visible: true,
      x: Math.round(tooltipX),
      y: Math.round(tooltipY),
      item: item
    };
  }

  onDragOver(event: DragEvent, compartmentId?: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (compartmentId) {
      this.dragOverCompartmentId = compartmentId;
      // Update tooltip with current position during drag (Ofer's requirement)
      this.updateDragTooltip(event, compartmentId);
    }
  }

  updateDragTooltip(event: DragEvent, compartmentId: string): void {
    if (!this.shipData || !this.draggedItem) return;

    // Find the target compartment
    const targetCompartment = this.shipData.containers
      .find((c) => c.id === this.draggedItem!.containerId)
      ?.compartments.find((comp) => comp.id === compartmentId);

    if (!targetCompartment) return;

    // Get the drag zone position to calculate current index
    const dropZone = event.currentTarget as HTMLElement;
    const rect = dropZone.getBoundingClientRect();
    const dragX = event.clientX - rect.left;
    const dragPercent = dragX / rect.width;

    // Get compartment dimensions
    const compartmentStart = targetCompartment.widthindexStart;
    const compartmentEnd = targetCompartment.widthindexEnd;
    const compartmentWidth = compartmentEnd - compartmentStart;
    
    // Get item dimensions
    const itemWidth = this.draggedItem.item.dimensionMcm || 27;
    
    // Calculate the position considering grab offset
    // The grab offset tells us where on the item the user grabbed it
    // We need to position the item so that the grabbed point aligns with the mouse position
    const mouseIndexPosition = compartmentStart + dragPercent * compartmentWidth;
    
    // Calculate item's left edge position based on grab offset
    // If grabOffset is 0.5 (middle), then: itemLeftEdge = mouseIndexPosition - (itemWidth * 0.5)
    const itemLeftEdgeIndex = mouseIndexPosition - (this.grabOffset * itemWidth);
    
    // The tooltip should show the central position of the item (left edge + half width)
    let currentIndex = itemLeftEdgeIndex + (itemWidth / 2);

    // Clamp tooltip to compartment range (consistent with onDrop behavior)
    currentIndex = Math.max(compartmentStart, Math.min(compartmentEnd, currentIndex));

    // TASK 4: Calculate start and stop indices (left and right edges of the item)
    // Start = position - (width / 2) = left edge
    // Stop = position + (width / 2) = right edge
    const startIndex = Math.round(currentIndex - (itemWidth / 2));
    const stopIndex = Math.round(currentIndex + (itemWidth / 2));

    // Update tooltip with rounded index value and start/stop values
    // Create new object reference to trigger change detection
    this.dragTooltip = {
      ...this.dragTooltip,
      index: Math.round(currentIndex),
      startIndex: startIndex,
      stopIndex: stopIndex,
      visible: true
    };

    // CRITICAL FIX: Update the dragged item's displayIndex directly in the data model
    // This ensures the position badge in the template updates immediately
    if (this.draggedItem) {
      // Update the actual item object's displayIndex so the template reflects the change
      this.draggedItem.item.displayIndex = Math.round(currentIndex);
    }

    // TASK 2 ENHANCEMENT: Show hover tooltip while dragging
    // Keep tooltip at FIXED Y position (below package), only update X position as package moves
    if (this.draggedItem) {
      // Center tooltip horizontally on cursor, but keep Y position fixed below the initial package position
      const tooltipX = event.clientX;
      
      this.tooltipState = {
        visible: true,
        x: Math.round(tooltipX),
        y: Math.round(this.initialTooltipY), // Keep Y fixed at initial position
        item: this.draggedItem.item
      };
    }

    // PACKAGE HIGHLIGHTS GHOST: Calculate ghost highlight position on timeline strip
    // Ghost shows where the package would be positioned during drag
    if (this.draggedItem) {
      // Get the item dimensions
      const itemWidth = this.draggedItem.item.dimensionMcm || 27;
      
      // Calculate ghost position as percentage of compartment
      const compartmentStart = targetCompartment.widthindexStart;
      const compartmentEnd = targetCompartment.widthindexEnd;
      const compartmentWidth = compartmentEnd - compartmentStart;
      
      // Calculate left edge in index coordinates
      const itemLeftEdgeIndex = mouseIndexPosition - (this.grabOffset * itemWidth);
      
      // Convert to percentage for timeline strip
      const ghostLeftPercent = ((itemLeftEdgeIndex - compartmentStart) / compartmentWidth) * 100;
      const ghostWidthPercent = (itemWidth / compartmentWidth) * 100;
      
      // Clamp to valid range [0-100]
      const clampedLeft = Math.max(0, Math.min(100, ghostLeftPercent));
      const clampedWidth = Math.max(3, Math.min(100 - clampedLeft, ghostWidthPercent));
      
      this.ghostHighlight = {
        left: `${clampedLeft}%`,
        width: `${clampedWidth}%`
      };
    }

    // Trigger change detection to update position badge in real-time during drag
    // Use markForCheck to ensure component is checked on next change detection cycle
    this.cdr.markForCheck();
  }

  onDragLeave(event: DragEvent, compartmentId: string): void {
    if (this.dragOverCompartmentId === compartmentId) {
      this.dragOverCompartmentId = null;
    }
  }

  onDrop(event: DragEvent, containerId: string, toCompartmentId: string): void {
    event.preventDefault();
    if (!this.draggedItem) return;

    // Calculate new position based on drop location
    const dropZone = event.currentTarget as HTMLElement;
    const rect = dropZone.getBoundingClientRect();
    const dropX = event.clientX - rect.left;
    const dropPercent = Math.max(0, Math.min(1, dropX / rect.width)); // Clamp percent to 0-1

    // Get target compartment to calculate position
    const targetCompartment = this.shipData?.containers
      .find((c) => c.id === containerId)
      ?.compartments.find((comp) => comp.id === toCompartmentId);
      
    if (targetCompartment) {
      // Calculate new position based on drop location while maintaining grab point
      const compartmentStart = targetCompartment.widthindexStart;
      const compartmentEnd = targetCompartment.widthindexEnd;
      const compartmentWidth = compartmentEnd - compartmentStart;
      
      // Get item dimensions
      const itemWidth = this.draggedItem.item.dimensionMcm || 27;
      
      // FIX: Maintain the exact grab point throughout the drag
      // The grab offset tells us where on the item the user grabbed it (0 = left edge, 1 = right edge)
      // We position the item so that the grabbed point aligns with the mouse release position
      const mouseIndexPosition = compartmentStart + dropPercent * compartmentWidth;
      let newPosition = mouseIndexPosition - (this.grabOffset * itemWidth);
      
      // Ensure position stays within target compartment bounds to prevent invisible items
      const minPosition = compartmentStart;
      const maxPosition = compartmentEnd - itemWidth;
      newPosition = Math.max(minPosition, Math.min(newPosition, maxPosition));

      // COLLISION DETECTION: Check if the new position would overlap with other items
      const wouldOverlap = this.containerService.doesItemOverlapWithOthers(
        toCompartmentId,
        newPosition,
        itemWidth,
        this.draggedItem.item.id
      );

      if (wouldOverlap) {
        // Find next available position instead
        const nextAvailablePos = this.containerService.getNextAvailablePosition(
          toCompartmentId,
          itemWidth,
          compartmentStart,
          compartmentEnd
        );

        if (nextAvailablePos !== null) {
          // Use the next available position instead
          newPosition = nextAvailablePos;
        } else {
          // No space available - reject the drop
          console.warn('Cannot drop item: insufficient space or collision detected');
          // Reset displayIndex before clearing
          if (this.draggedItem) {
            this.draggedItem.item.displayIndex = undefined;
          }
          this.draggedItem = null;
          this.dragTooltip.visible = false;
          this.tooltipState = { visible: false, x: 0, y: 0, item: null }; // Clear hover tooltip on reject
          this.initialTooltipY = 0; // Reset initial tooltip Y position
          this.ghostHighlight = null; // Clear ghost highlight on reject
          this.isDragging = false;
          this.grabOffset = 0;
          this.hoveredItemId = null;
          return;
        }
      }

      // Set displayIndex as rounded value for tooltip/display purposes only
      // displayIndex should show the center position of the item
      const displayIndex = Math.round(newPosition + (itemWidth / 2));

      // Allow drops within same compartment or to different compartment
      if (this.draggedItem.compartmentId === toCompartmentId) {
        // Same compartment - just update position (preserves exact grab point)
        this.containerService.updateItemPositionInCompartment(
          containerId,
          toCompartmentId,
          this.draggedItem.item.id,
          newPosition,
          displayIndex
        );
      } else {
        // Different compartment - move item with exact grab point preserved
        this.containerService.moveItemBetweenCompartments(
          this.draggedItem.containerId,
          this.draggedItem.compartmentId,
          containerId,
          toCompartmentId,
          this.draggedItem.item.id,
          newPosition,
          displayIndex
        );
      }
    }

    // Reset displayIndex to null so it uses getCentralPositionIndex again
    if (this.draggedItem) {
      this.draggedItem.item.displayIndex = undefined;

      // UNDO/REDO: Record the drag operation
      this.recordDragOperation(this.draggedItem.item.name, this.draggedItem.item.id);
    }
    
    this.draggedItem = null;
    this.dragTooltip.visible = false;
    this.tooltipState = { visible: false, x: 0, y: 0, item: null }; // Clear hover tooltip on drag end
    this.initialTooltipY = 0; // Reset initial tooltip Y position
    this.ghostHighlight = null; // Clear ghost highlight on drag end
    this.isDragging = false;
    this.grabOffset = 0; // Reset grab offset for next drag
    // Clear hovered item after drag completes
    this.hoveredItemId = null;
  }

  onDownload(compartment: Compartment): void {
    console.log('Download compartment', compartment.id);
  }

  onRefresh(): void {
    console.log('Refresh data');
  }

  onColorChange(event: Event, item: Item): void {
    const input = event.target as HTMLInputElement;
    const newColor = input.value;
    
    // Update the item's color
    item.color = newColor;
    
    // Trigger change detection
    this.shipData = { ...this.shipData! };
  }

  getItemColor(item: Item): string {
    return item.color || '#7dd3fc'; // Default light blue color
  }

  onItemMouseEnter(itemId: string, event: MouseEvent): void {
    // FIX 1: Add boundary checking - only show tooltip when hovering directly over the item
    const itemElement = (event.target as HTMLElement).closest('.item');
    if (!itemElement) {
      return;
    }

    const itemRect = itemElement.getBoundingClientRect();
    const pointerX = event.clientX;
    const pointerY = event.clientY;

    // Check if pointer is actually within the item's bounds
    if (pointerX >= itemRect.left && pointerX <= itemRect.right &&
        pointerY >= itemRect.top && pointerY <= itemRect.bottom) {
      this.hoveredItemId = itemId;
      
      // TASK 2 FIX: Show global overlay tooltip at the correct position
      // Find the item data from shipData
      let foundItem: Item | null = null;
      if (this.shipData) {
        for (const container of this.shipData.containers) {
          for (const compartment of container.compartments) {
            const item = compartment.items.find(i => i.id === itemId);
            if (item) {
              foundItem = item;
              break;
            }
          }
          if (foundItem) break;
        }
      }

      if (foundItem) {
        // Position tooltip BELOW the item, centered horizontally (per Avihai's requirement)
        const tooltipX = itemRect.left + itemRect.width / 2;
        const tooltipY = itemRect.bottom + 15; // 15px below the item
        
        this.tooltipState = {
          visible: true,
          x: Math.round(tooltipX),
          y: Math.round(tooltipY),
          item: foundItem
        };
      }
    }
  }

  onItemMouseMove(itemId: string, event: MouseEvent): void {
    // Update tooltip position as user moves mouse over item
    if (this.hoveredItemId === itemId && this.tooltipState.item) {
      const itemElement = (event.target as HTMLElement).closest('.item');
      if (itemElement) {
        const itemRect = itemElement.getBoundingClientRect();
        // Position tooltip BELOW the item, centered horizontally
        const tooltipX = itemRect.left + itemRect.width / 2;
        const tooltipY = itemRect.bottom + 15; // 15px below the item
        
        this.tooltipState = {
          ...this.tooltipState,
          x: Math.round(tooltipX),
          y: Math.round(tooltipY)
        };
      }
    }
  }

  onItemMouseLeave(): void {
    // Don't clear hoveredItemId during drag - tooltip should remain visible during drag operations
    if (!this.isDragging) {
      this.hoveredItemId = null;
      this.tooltipState = { visible: false, x: 0, y: 0, item: null };
    }
  }

  onItemContextMenu(event: MouseEvent, containerId: string, compartmentId: string, itemId: string): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      containerId,
      compartmentId,
      itemId
    };
  }

  closeContextMenu(): void {
    this.contextMenu.visible = false;
  }

  onRemoveItem(): void {
    if (!this.shipData) return;

    const container = this.shipData.containers.find(c => c.id === this.contextMenu.containerId);
    if (!container) return;

    const compartment = container.compartments.find(comp => comp.id === this.contextMenu.compartmentId);
    if (!compartment) return;

    // Find the item to get its weight and width for stats update
    const itemToRemove = compartment.items.find(item => item.id === this.contextMenu.itemId);
    if (!itemToRemove) {
      this.closeContextMenu();
      return;
    }

    // Remove the item from the compartment
    const itemIndex = compartment.items.findIndex(item => item.id === this.contextMenu.itemId);
    if (itemIndex > -1) {
      const itemWeight = itemToRemove.weightKg;
      const itemWidth = itemToRemove.dimensionMcm || 27;
      
      // Remove from items array
      compartment.items.splice(itemIndex, 1);
      
      // Recalculate compartment statistics
      const newWeight = compartment.weightKg - itemWeight;
      compartment.weightKg = newWeight;
      compartment.weightUtilization = parseFloat(((newWeight / compartment.totalCapacity) * 100).toFixed(2));
      
      // Recalculate width utilization based on remaining items
      const totalPackageWidth = compartment.items.reduce((sum, item) => sum + (item.dimensionMcm || 27), 0);
      compartment.widthUtilization = parseFloat(((totalPackageWidth / compartment.widthMcm) * 100).toFixed(1));
      
      // Trigger change detection by creating a new reference
      this.shipData = { ...this.shipData };
    }

    this.closeContextMenu();
  }

  // TASK 4: Add top axis highlighting for packages (Avihai's requirement)
  getAxisHighlightPosition(item: Item, compartment: Compartment): { left: string; width: string } {
    const compartmentRangeStart = compartment.widthindexStart;
    const compartmentRangeEnd = compartment.widthindexEnd;
    const compartmentRangeSize = compartmentRangeEnd - compartmentRangeStart;

    const itemStart = item.position;
    const itemDimension = item.dimensionMcm || 27;

    // Calculate position relative to compartment's widthindex range
    let leftPercent = ((itemStart - compartmentRangeStart) / compartmentRangeSize) * 100;
    let widthPercent = ((itemDimension) / compartmentRangeSize) * 100;

    // Clamp values to 0-100%
    leftPercent = Math.max(0, Math.min(100, leftPercent));
    widthPercent = Math.max(3, Math.min(100, widthPercent));

    if (leftPercent + widthPercent > 100) {
      widthPercent = 100 - leftPercent;
    }

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  }

  // TASK 3 & 2: Calculate container-level weight utilization
  // Weight utilization = total weight in container / container's total weight capacity
  getContainerWeightUtilization(container: Container): string {
    // Calculate total weight in all compartments
    let totalWeightInContainer = 0;
    // Calculate total capacity of container (sum of all compartments' capacity)
    let totalContainerCapacity = 0;

    container.compartments.forEach((compartment) => {
      totalWeightInContainer += compartment.weightKg;
      totalContainerCapacity += compartment.totalCapacity;
    });

    if (totalContainerCapacity === 0) {
      return '0';
    }

    const utilization = (totalWeightInContainer / totalContainerCapacity) * 100;
    return utilization.toFixed(2);
  }

  // OFER REQUIREMENT: Get central position width index for package tooltip
  // This should show below each package permanently (not just during drag)
  getCentralPositionIndex(item: Item): string {
    // Central position = item.position + (item.dimensionMcm / 2)
    const centralPosition = item.position + (item.dimensionMcm / 2);
    return Math.round(centralPosition).toString();
  }

  // Get position for axis label (tooltip below axis with connector line)
  getAxisLabelPosition(item: Item, compartment: Compartment): { left: string } {
    const compartmentRangeStart = compartment.widthindexStart;
    const compartmentRangeEnd = compartment.widthindexEnd;
    const compartmentRangeSize = compartmentRangeEnd - compartmentRangeStart;

    const itemStart = item.position;
    const itemDimension = item.dimensionMcm || 27;
    const centralPosition = itemStart + itemDimension / 2;

    // Calculate left position as percentage of compartment range
    let leftPercent = ((centralPosition - compartmentRangeStart) / compartmentRangeSize) * 100;

    // Clamp to compartment bounds
    leftPercent = Math.max(0, Math.min(100, leftPercent));

    return {
      left: `${leftPercent}%`
    };
  }

  // TODO 1: Get drop zones visualization for valid drop areas
  // Creates a visual grid showing where packages can be dropped
  getDropZones(compartment: Compartment): Array<{ left: string; width: string }> {
    const compartmentRangeSize = compartment.widthindexEnd - compartment.widthindexStart;
    const zoneCount = 10; // Show 10 zones across the compartment
    const zoneWidth = 100 / zoneCount;
    
    const zones = [];
    for (let i = 0; i < zoneCount; i++) {
      zones.push({
        left: `${i * zoneWidth}%`,
        width: `${zoneWidth}%`
      });
    }
    
    return zones;
  }

  // TODO 2: Get available items (items that have been added to the container structure but not yet placed in compartments)
  // Note: In the current implementation, all items are already placed in compartments
  // This method returns empty for now (can be extended for future features like an item pool)
  getAvailableItems(): Array<any> {
    // Placeholder for available items that haven't been placed yet
    // In a future enhancement, this could come from a separate inventory pool
    return [];
  }

  // TODO 2: Get total count of available items
  getTotalAvailableItems(): number {
    return this.getAvailableItems().length;
  }

  // TODO 2: Get placed items - items currently in compartments across all containers
  getPlacedItems(): Array<any> {
    const placedItems: Array<any> = [];
    
    if (!this.shipData) return placedItems;
    
    // Iterate through all containers and compartments to collect placed items
    this.shipData.containers.forEach((container) => {
      container.compartments.forEach((compartment) => {
        compartment.items.forEach((item) => {
          placedItems.push({
            ...item,
            location: `${container.name} (${compartment.index}/${container.compartments.length})`
          });
        });
      });
    });
    
    return placedItems;
  }

  // TODO 2: Get total count of placed items
  getTotalPlacedItems(): number {
    return this.getPlacedItems().length;
  }

  // TODO 3: Get compartment background color (default: light gray)
  getCompartmentColor(compartment: Compartment): string {
    return compartment.backgroundColor || '#e8e8e8';
  }

  // TODO 3: Handle compartment color change
  onCompartmentColorChange(event: Event, compartment: Compartment): void {
    const input = event.target as HTMLInputElement;
    const newColor = input.value;
    
    // Update the compartment's background color
    compartment.backgroundColor = newColor;
    
    // Trigger change detection
    this.shipData = { ...this.shipData! };
  }

  // TODO 4: Calculate tooltip positioning - check if tooltip fits above or needs to go below
  calculateTooltipPosition(itemId: string): void {
    // Use setTimeout to allow DOM to update before calculating position
    setTimeout(() => {
      const tooltipElement = document.querySelector(`.item-hover-tooltip.visible`) as HTMLElement;
      const itemElement = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
      
      if (!tooltipElement || !itemElement) {
        // Default to above if elements not found
        this.tooltipPositioning[itemId] = 'above';
        return;
      }
      
      const itemRect = itemElement.getBoundingClientRect();
      const tooltipHeight = tooltipElement.offsetHeight;
      const tooltipWidth = tooltipElement.offsetWidth;
      
      // Calculate if there's enough space above the item
      const spaceAbove = itemRect.top - tooltipHeight - 10; // 10px padding
      const spaceBelow = window.innerHeight - (itemRect.bottom + tooltipHeight + 10);
      
      // Position above if there's enough space, otherwise below
      if (spaceAbove > 20) {
        this.tooltipPositioning[itemId] = 'above';
      } else {
        this.tooltipPositioning[itemId] = 'below';
      }
    }, 0);
  }

  // TODO 4: Get tooltip positioning class
  getTooltipPositioning(itemId: string): string {
    const positioning = this.tooltipPositioning[itemId];
    if (positioning === 'below') {
      return 'tooltip-below';
    }
    return 'tooltip-above';
  }

  // Remove item from compartment by dragging from placed items list
  onDragStartPlacedItem(event: DragEvent, item: Item): void {
    // Find which container and compartment this item belongs to
    if (!this.shipData) return;

    for (const container of this.shipData.containers) {
      for (const compartment of container.compartments) {
        if (compartment.items.find(i => i.id === item.id)) {
          this.draggedPlacedItem = { containerId: container.id, compartmentId: compartment.id, item };
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', item.id);
          }
          return;
        }
      }
    }
  }

  onDragOverRemoveZone(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverRemoveZone = true;
  }

  onDragLeaveRemoveZone(event: DragEvent): void {
    // Only clear if leaving the items-list-container (the entire sidebar section)
    const itemsListContainer = (event.currentTarget as HTMLElement).closest('.items-list-container');
    const target = event.relatedTarget as HTMLElement;
    
    // Only clear drag-over state if we're leaving the entire items-list-container
    if (!target || !itemsListContainer?.contains(target)) {
      this.dragOverRemoveZone = false;
    }
  }

  onDropToRemove(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggedPlacedItem) return;

    // Remove the item from its compartment
    this.containerService.removeItemFromCompartment(
      this.draggedPlacedItem.containerId,
      this.draggedPlacedItem.compartmentId,
      this.draggedPlacedItem.item.id
    );

    // If the item came from available packages, add it back to the available packages list
    if (this.draggedPlacedItem.item.sourcePackageId && this.availablePackagesComponent) {
      const sourcePackageId = this.draggedPlacedItem.item.sourcePackageId;
      // Create a package to add back to available packages
      const packageToRestore: Item = {
        id: sourcePackageId,
        name: this.draggedPlacedItem.item.name,
        dimensionMcm: this.draggedPlacedItem.item.dimensionMcm,
        weightKg: this.draggedPlacedItem.item.weightKg,
        destination: this.draggedPlacedItem.item.destination,
        position: 0,
        length: this.draggedPlacedItem.item.length,
        color: this.draggedPlacedItem.item.color,
      };
      this.availablePackagesComponent.addPackageToAvailable(packageToRestore);
    }

    this.draggedPlacedItem = null;
    this.dragOverRemoveZone = false;
  }

  // NEW: Remove item from placed items list via close button (X icon)
  onRemoveFromPlacedItems(item: Item, event: Event): void {
    event.stopPropagation();
    
    if (!this.shipData) return;

    // Find the container and compartment for this item
    for (const container of this.shipData.containers) {
      for (const compartment of container.compartments) {
        if (compartment.items.find(i => i.id === item.id)) {
          // Remove the item from its compartment via service
          this.containerService.removeItemFromCompartment(
            container.id,
            compartment.id,
            item.id
          );

          // If the item came from available packages, add it back to the available packages list
          if (item.sourcePackageId && this.availablePackagesComponent) {
            const sourcePackageId = item.sourcePackageId;
            // Create a package to add back to available packages
            const packageToRestore: Item = {
              id: sourcePackageId,
              name: item.name,
              dimensionMcm: item.dimensionMcm,
              weightKg: item.weightKg,
              destination: item.destination,
              position: 0,
              length: item.length,
              color: item.color,
            };
            this.availablePackagesComponent.addPackageToAvailable(packageToRestore);
          }
          return;
        }
      }
    }
  }

  onDragOverAvailableZone(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverAvailableZone = true;
  }

  onDragLeaveAvailableZone(event: DragEvent): void {
    // Only clear if leaving the items-list-container (the entire sidebar section)
    const itemsListContainer = (event.currentTarget as HTMLElement).closest('.items-list-container');
    const target = event.relatedTarget as HTMLElement;
    
    // Only clear drag-over state if we're leaving the entire items-list-container
    if (!target || !itemsListContainer?.contains(target)) {
      this.dragOverAvailableZone = false;
    }
  }

  onDropToAvailable(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggedPlacedItem) return;

    // Remove the item from its compartment
    this.containerService.removeItemFromCompartment(
      this.draggedPlacedItem.containerId,
      this.draggedPlacedItem.compartmentId,
      this.draggedPlacedItem.item.id
    );

    this.draggedPlacedItem = null;
    this.dragOverAvailableZone = false;
  }

  // ==================== BULK IMPORT METHODS ====================

  /**
   * Get existing packages for bulk import duplicate detection
   */
  getExistingPackagesForBulkImport(): Item[] {
    // Return packages from available packages component if available
    // This is used to detect duplicates during bulk import
    if (!this.availablePackagesComponent) {
      return [];
    }
    // Note: availablePackages is private, so we return empty array
    // Bulk import will work without duplicate detection based on existing packages
    // since each bulk-imported package gets a unique ID
    return [];
  }

  /**
   * Handle imported packages from bulk import dialog
   */
  onBulkImportComplete(importedPackages: Item[]): void {
    if (!this.availablePackagesComponent) {
      return;
    }

    // Add all imported packages to the available packages list
    importedPackages.forEach((pkg) => {
      this.availablePackagesComponent.addPackageToAvailable(pkg);
    });

    // Show success message
    this.loadingMessage = `✅ Successfully imported ${importedPackages.length} packages!`;
    setTimeout(() => {
      this.loadingMessage = null;
    }, 3000);
  }

  // Available Packages Panel Methods

  /**
   * Toggle the available packages panel collapse state
   */
  onToggleAvailablePackagesPanel(): void {
    this.isAvailablePackagesPanelCollapsed = !this.isAvailablePackagesPanelCollapsed;
  }

  /**
   * Toggle side panel collapse state
   */
  onToggleSidePanel(): void {
    this.isSidePanelCollapsed = !this.isSidePanelCollapsed;
  }

  // Toggle search area collapse state
  onToggleSearchCollapse(): void {
    this.isSearchCollapsed = !this.isSearchCollapsed;
  }

  /**
   * Handle drag start from available packages
   */
  onAvailablePackageDragStart(event: { item: Item; event: DragEvent }): void {
    this.draggedAvailablePackage = event.item;
  }

  /**
   * Handle drag over compartment when dragging from available packages
   */
  onDragOverFromAvailable(dragEvent: DragEvent, compartmentId?: string): void {
    dragEvent.preventDefault();
    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.dropEffect = 'copy';
    }
    if (compartmentId) {
      this.dragOverCompartmentId = compartmentId;
      // Update tooltip with current position during drag
      this.updateDragTooltip(dragEvent, compartmentId);
    }
  }

  /**
   * Create a new item instance from an available package
   * Each instance gets a unique ID and is positioned at the drop location
   */
  private createItemFromAvailablePackage(
    availablePackage: Item,
    containerId: string,
    compartmentId: string,
    newPosition: number,
    displayIndex: number
  ): Item {
    // Generate a unique ID for this item instance
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 5);
    const uniqueId = `item-${timestamp}-${randomPart}`;

    return {
      id: uniqueId,
      name: availablePackage.name,
      dimensionMcm: availablePackage.dimensionMcm,
      weightKg: availablePackage.weightKg,
      destination: availablePackage.destination,
      position: newPosition,
      length: availablePackage.length,
      displayIndex,
      color: availablePackage.color,
      sourcePackageId: availablePackage.id, // Track which available package this came from
    };
  }

  /**
   * Handle drop from available packages into a compartment
   */
  onDropFromAvailablePackages(event: DragEvent, containerId: string, toCompartmentId: string): void {
    event.preventDefault();
    if (!this.draggedAvailablePackage || !this.shipData) return;

    // Calculate new position based on drop location
    const dropZone = event.currentTarget as HTMLElement;
    const rect = dropZone.getBoundingClientRect();
    const dropX = event.clientX - rect.left;
    const dropPercent = Math.max(0, Math.min(1, dropX / rect.width));

    // Get target compartment to calculate position
    const targetCompartment = this.shipData.containers
      .find((c) => c.id === containerId)
      ?.compartments.find((comp) => comp.id === toCompartmentId);

    if (targetCompartment) {
      // Calculate new position based on drop location
      const compartmentStart = targetCompartment.widthindexStart;
      const compartmentEnd = targetCompartment.widthindexEnd;
      const compartmentWidth = compartmentEnd - compartmentStart;

      // Get item dimensions
      const itemWidth = this.draggedAvailablePackage.dimensionMcm || 27;

      // Calculate position with the same logic as existing items
      const mouseIndexPosition = compartmentStart + dropPercent * compartmentWidth;
      let newPosition = mouseIndexPosition - (itemWidth / 2); // Center on drop point

      // Ensure position stays within target compartment bounds
      const minPosition = compartmentStart;
      const maxPosition = compartmentEnd - itemWidth;
      newPosition = Math.max(minPosition, Math.min(newPosition, maxPosition));

      // COLLISION DETECTION: Check if the new position would overlap with other items
      const wouldOverlap = this.containerService.doesItemOverlapWithOthers(
        toCompartmentId,
        newPosition,
        itemWidth
      );

      if (wouldOverlap) {
        // Find next available position instead
        const nextAvailablePos = this.containerService.getNextAvailablePosition(
          toCompartmentId,
          itemWidth,
          compartmentStart,
          compartmentEnd
        );

        if (nextAvailablePos !== null) {
          // Use the next available position instead
          newPosition = nextAvailablePos;
        } else {
          // No space available - reject the drop
          console.warn('Cannot drop item: insufficient space or collision detected');
          this.draggedAvailablePackage = null;
          this.dragTooltip.visible = false;
          this.dragOverCompartmentId = null;
          return;
        }
      }

      const displayIndex = Math.round(newPosition + (itemWidth / 2));

      // Create a new item instance from the available package
      const newItem = this.createItemFromAvailablePackage(
        this.draggedAvailablePackage,
        containerId,
        toCompartmentId,
        newPosition,
        displayIndex
      );

      // Get the current container and compartment
      const container = this.shipData.containers.find((c) => c.id === containerId);
      if (container) {
        const compartment = container.compartments.find((comp) => comp.id === toCompartmentId);
        if (compartment) {
          // Add the new item to the compartment
          compartment.items.push(newItem);

          // Recalculate compartment statistics
          const itemWeight = newItem.weightKg;
          const newWeight = compartment.weightKg + itemWeight;
          compartment.weightKg = newWeight;
          compartment.weightUtilization = parseFloat(
            ((newWeight / compartment.totalCapacity) * 100).toFixed(2)
          );

          // Recalculate width utilization
          const totalPackageWidth = compartment.items.reduce(
            (sum, item) => sum + (item.dimensionMcm || 27),
            0
          );
          compartment.widthUtilization = parseFloat(
            ((totalPackageWidth / compartment.widthMcm) * 100).toFixed(1)
          );

          // Remove package from available packages list since it's now placed in the container
          if (this.availablePackagesComponent && this.draggedAvailablePackage) {
            this.availablePackagesComponent.removePackageFromAvailable(this.draggedAvailablePackage.id);
          }

          // Trigger change detection
          this.shipData = { ...this.shipData };
        }
      }
    }

    this.draggedAvailablePackage = null;
    this.dragTooltip.visible = false;
    this.dragOverCompartmentId = null;
  }

  // Container Reordering Methods
  onMoveContainerUp(containerId: string): void {
    this.containerService.moveContainerUp(containerId);
  }

  onMoveContainerDown(containerId: string): void {
    this.containerService.moveContainerDown(containerId);
  }

  // TASK 5: Conv popup methods
  openConvPopup(item: Item, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling
    this.convPopup = { visible: true, item };
  }

  closeConvPopup(): void {
    this.convPopup = { visible: false, item: null };
  }

  onConvPopupBackdropClick(event: MouseEvent): void {
    // Close popup when clicking on the backdrop/overlay
    if (event.target === event.currentTarget) {
      this.closeConvPopup();
    }
  }

  // TASK 2 FIX: Get compartment utilization for a given item
  getTooltipCompartmentUtilization(item: Item): number {
    if (!this.shipData) return 0;
    
    // Find which compartment contains this item
    for (const container of this.shipData.containers) {
      for (const compartment of container.compartments) {
        if (compartment.items.find(i => i.id === item.id)) {
          return compartment.widthUtilization;
        }
      }
    }
    return 0;
  }

  // Tree structure state for conveyor window areas
  conveyorExpandedAreas: { [areaId: string]: boolean } = {};

  // NEW: Get conveyor visualization data for a package with hierarchical tree structure
  getConveyorData(item: Item): any {
    if (!this.shipData) return null;

    // Find the compartment containing this item
    let compartment: Compartment | null = null;
    let compartmentIndex: number = 0;
    
    for (const container of this.shipData.containers) {
      compartmentIndex = 0;
      for (const comp of container.compartments) {
        if (comp.items.find(i => i.id === item.id)) {
          compartment = comp;
          break;
        }
        compartmentIndex++;
      }
      if (compartment) break;
    }

    if (!compartment) return null;

    // Generate conveyor structure with hierarchical tree
    const areaStart = Math.floor(compartment.widthindexStart / 100) * 100;
    const areaEnd = Math.ceil(compartment.widthindexEnd / 100) * 100;
    const rangeSpan = areaEnd - areaStart;

    // Define 4 areas with their width ranges
    const areaDefinitions = [
      { id: '1-A', name: '1 - A', startIndex: 1000, endIndex: 1900, color: '#e0e0e0' },
      { id: '1-B', name: '1 - B', startIndex: 1900, endIndex: 2800, color: '#2196F3' },
      { id: '1-C', name: '1 - C', startIndex: 2800, endIndex: 3550, color: '#e0e0e0' },
      { id: '1-D', name: '1 - D', startIndex: 3550, endIndex: 4400, color: '#e0e0e0' }
    ];

    // Calculate which area contains the item (for default expansion)
    let highlightedAreaId = '1-B';
    for (const areaDef of areaDefinitions) {
      if (item.position >= areaDef.startIndex && item.position <= areaDef.endIndex) {
        highlightedAreaId = areaDef.id;
        break;
      }
    }

    // Build hierarchical tree structure with areas and sections
    const areas = areaDefinitions.map((areaDef) => {
      const isExpanded = this.conveyorExpandedAreas[areaDef.id] !== undefined 
        ? this.conveyorExpandedAreas[areaDef.id] 
        : (areaDef.id === highlightedAreaId); // Expand highlighted area by default

      // For expanded areas, create 4 sections (B1, B2, B3, B4)
      const sections = isExpanded ? this.createAreaSections(areaDef, areaStart, areaEnd, item, compartmentIndex) : [];

      return {
        id: areaDef.id,
        name: areaDef.name,
        startIndex: areaDef.startIndex,
        endIndex: areaDef.endIndex,
        width: ((areaDef.endIndex - areaDef.startIndex) / rangeSpan) * 100,
        color: areaDef.color,
        highlighted: areaDef.id === highlightedAreaId,
        expanded: isExpanded,
        sections: sections
      };
    });

    // Calculate total allocated cells across all sections
    let allocatedCells = 0;
    areas.forEach(area => {
      area.sections.forEach((section: any) => {
        allocatedCells += section.cells.filter((c: any) => c.allocated).length;
      });
    });

    return {
      title: `Conveyor ${compartmentIndex + 1}`,
      areaStart: areaStart,
      areaEnd: areaEnd,
      areas: areas,
      allocatedCells: allocatedCells
    };
  }

  // Helper method to create sections for an expanded area
  private createAreaSections(areaDef: any, globalStart: number, globalEnd: number, item: Item, compartmentIndex: number): any[] {
    const areaWidth = areaDef.endIndex - areaDef.startIndex;
    const cellsPerSection = Math.floor(areaWidth / 4);
    const sections = [];

    const sectionColors = ['#d32f2f', '#4caf50', '#ff9800', '#1565c0']; // Red, Green, Orange, Blue

    for (let i = 0; i < 4; i++) {
      const sectionStart = areaDef.startIndex + (i * cellsPerSection);
      const sectionEnd = sectionStart + cellsPerSection;
      const sectionName = `${areaDef.name.split(' - ')[1]}${i + 1}`; // e.g., "A1", "A2", etc.
      
      // Create grid cells for this section
      const cells = [];
      const cellCount = 45;
      
      for (let c = 0; c < cellCount; c++) {
        const cellValue = sectionStart + c;
        const isInItemRange = cellValue >= item.position - (item.dimensionMcm / 2) && 
                              cellValue <= item.position + (item.dimensionMcm / 2);
        
        const cellColor = isInItemRange ? sectionColors[i] : '#d0d0d0';

        cells.push({
          value: c,
          allocated: isInItemRange,
          color: cellColor
        });
      }

      sections.push({
        name: sectionName,
        startRange: sectionStart,
        endRange: sectionEnd,
        cells: cells
      });
    }

    return sections;
  }

  // Toggle area expansion in conveyor tree
  toggleConveyorAreaExpansion(areaId: string): void {
    // Allow only one area expanded at a time (optional - change if user wants multiple)
    if (this.conveyorExpandedAreas[areaId]) {
      this.conveyorExpandedAreas[areaId] = false;
    } else {
      // Close all other areas
      Object.keys(this.conveyorExpandedAreas).forEach(key => {
        this.conveyorExpandedAreas[key] = false;
      });
      // Open this area
      this.conveyorExpandedAreas[areaId] = true;
    }
  }

  // NEW: Handle allocate button click
  onAllocatePackage(): void {
    // Close the modal after allocation
    this.closeConvPopup();
    // In future, this could trigger allocation logic if needed
  }

  // ========== UNDO/REDO INTEGRATION ==========

  /**
   * Capture state before a drag operation starts
   */
  capturePreviousState(): void {
    if (this.shipData) {
      this.previousStateBeforeDrag = JSON.parse(JSON.stringify(this.shipData));
    }
  }

  /**
   * Record a drag operation for undo/redo
   */
  recordDragOperation(itemName: string, itemId: string): void {
    if (!this.shipData || !this.previousStateBeforeDrag) return;

    // Check if state actually changed
    if (JSON.stringify(this.previousStateBeforeDrag) === JSON.stringify(this.shipData)) {
      return; // No actual change, don't record
    }

    this.undoRedoService.recordOperation(
      'drag',
      `Moved ${itemName} to new position`,
      this.previousStateBeforeDrag,
      JSON.parse(JSON.stringify(this.shipData)),
      itemId,
      itemName
    );

    this.previousStateBeforeDrag = null;
  }

  /**
   * Record a package removal for undo/redo
   */
  recordRemovalOperation(itemName: string, itemId: string): void {
    if (!this.shipData) return;

    // We need the state before removal, which should have been captured
    // For now, we'll just record with minimal context
    const beforeState = JSON.parse(JSON.stringify(this.shipData));
    this.undoRedoService.recordOperation(
      'remove',
      `Removed package ${itemName}`,
      beforeState,
      JSON.parse(JSON.stringify(this.shipData)),
      itemId,
      itemName
    );
  }

  /**
   * Record bulk import operation for undo/redo
   */
  recordBulkImportOperation(count: number): void {
    if (!this.shipData) return;

    this.undoRedoService.recordOperation(
      'bulk-import',
      `Imported ${count} packages`,
      this.previousStateBeforeDrag || JSON.parse(JSON.stringify(this.shipData)),
      JSON.parse(JSON.stringify(this.shipData))
    );

    this.previousStateBeforeDrag = null;
  }

  /**
   * Restore state from undo/redo
   */
  restoreStateFromHistory(newState: ShipData): void {
    if (newState) {
      // Update shipData with the restored state
      this.shipData = JSON.parse(JSON.stringify(newState));
      this.applyFilters();
      this.cdr.markForCheck();
    }
  }

  /**
   * Toggle history viewer panel
   */
  toggleHistoryViewer(): void {
    this.historyViewerOpen = !this.historyViewerOpen;
  }

  /**
   * Handle state selection from history viewer
   */
  onHistoryStateSelected(index: number): void {
    const state = this.undoRedoService.getStateAtIndex(index);
    if (state) {
      this.restoreStateFromHistory(state);
    }
  }

  // ========== HELP SYSTEM ==========

  /**
   * Toggle help panel
   */
  toggleHelpPanel(): void {
    this.helpPanelOpen = !this.helpPanelOpen;
  }

  /**
   * Start guided tour
   */
  startGuidedTour(): void {
    this.helpService.startTour();
  }
}
