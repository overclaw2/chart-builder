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
  contextMenu: { visible: boolean; x: number; y: number; containerId: string; compartmentId: string; itemId: string } = {
    visible: false,
    x: 0,
    y: 0,
    containerId: '',
    compartmentId: '',
    itemId: ''
  };

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
    
    // Ensure minimum width visibility
    widthPercent = Math.max(3, Math.min(100, widthPercent));
    
    // Adjust right edge if item extends beyond compartment
    if (leftPercent + widthPercent > 100) {
      widthPercent = 100 - leftPercent;
    }
    
    // Ensure width is never 0
    if (widthPercent <= 0) {
      widthPercent = 3; // Minimum width to ensure visibility
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
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.dragTooltip.visible = true;
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

    // Calculate the index at current mouse position
    let currentIndex =
      targetCompartment.widthindexStart +
      dragPercent * (targetCompartment.widthindexEnd - targetCompartment.widthindexStart);

    // NEW: Clamp tooltip to compartment range (consistent with onDrop behavior)
    const compartmentStart = targetCompartment.widthindexStart;
    const compartmentEnd = targetCompartment.widthindexEnd;
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
    const dropPercent = dropX / rect.width;

    // Get target compartment to calculate position
    const targetCompartment = this.shipData?.containers
      .find((c) => c.id === containerId)
      ?.compartments.find((comp) => comp.id === toCompartmentId);
      
    if (targetCompartment) {
      // Calculate new position based on drop location (Avihai's requirement: stay where dropped)
      let newPosition =
        targetCompartment.widthindexStart +
        dropPercent * (targetCompartment.widthindexEnd - targetCompartment.widthindexStart);

      // NEW: Ofer's Requirement - Clamp position to compartment range
      // If user drops outside the axis range, align to nearest available index
      const compartmentStart = targetCompartment.widthindexStart;
      const compartmentEnd = targetCompartment.widthindexEnd;
      
      // Clamp the position to stay within compartment bounds
      newPosition = Math.max(compartmentStart, Math.min(compartmentEnd, newPosition));

      // For Ofer's requirement: set displayIndex to show below package
      // Round to nearest integer for clean display
      const displayIndex = Math.round(newPosition);

      // Allow drops within same compartment (Avihai's fix) or to different compartment
      if (this.draggedItem.compartmentId === toCompartmentId) {
        // Same compartment - just update position
        this.containerService.updateItemPositionInCompartment(
          containerId,
          toCompartmentId,
          this.draggedItem.item.id,
          newPosition,
          displayIndex
        );
      } else {
        // Different compartment - move item
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

  onItemMouseEnter(itemId: string): void {
    this.hoveredItemId = itemId;
  }

  onItemMouseLeave(): void {
    this.hoveredItemId = null;
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
}
