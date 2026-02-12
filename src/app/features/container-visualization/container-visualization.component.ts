import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerService } from '../../core/services/container.service';
import { ShipData, Container, Item, Compartment } from '../../core/models/container.model';

@Component({
  selector: 'app-container-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './container-visualization.component.html',
  styleUrls: ['./container-visualization.component.css'],
})
export class ContainerVisualizationComponent implements OnInit {
  shipData: ShipData | null = null;
  draggedItem: { containerId: string; compartmentId: string; item: Item } | null = null;
  dragOverCompartmentId: string | null = null;
  loadingMessage: string | null = null;
  dragTooltip: { index: number; visible: boolean } = { index: 0, visible: false };
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

  constructor(private containerService: ContainerService) {}

  ngOnInit(): void {
    this.containerService.getShipData().subscribe((data) => {
      this.shipData = data;
    });
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

    // Update tooltip with rounded index value
    this.dragTooltip.index = Math.round(currentIndex);
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

    this.draggedItem = null;
    this.dragTooltip.visible = false;
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
      // TODO 4: Calculate tooltip positioning
      this.calculateTooltipPosition(itemId);
    }
  }

  onItemMouseLeave(): void {
    // Don't clear hoveredItemId during drag - tooltip should remain visible during drag operations
    if (!this.isDragging) {
      this.hoveredItemId = null;
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
}
