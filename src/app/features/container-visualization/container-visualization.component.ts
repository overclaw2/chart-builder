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

  constructor(private containerService: ContainerService) {}

  ngOnInit(): void {
    this.containerService.getShipData().subscribe((data) => {
      this.shipData = data;
    });
  }

  getItemPosition(item: Item, compartment: Compartment): { left: string; width: string } {
    const compartmentWidth = compartment.totalCapacity;
    const itemStart = item.position;
    const itemEnd = item.position + item.length;
    
    const leftPercent = (itemStart / compartmentWidth) * 100;
    const widthPercent = ((itemEnd - itemStart) / compartmentWidth) * 100;

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
  }

  onDragOver(event: DragEvent, compartmentId?: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (compartmentId) {
      this.dragOverCompartmentId = compartmentId;
    }
  }

  onDragLeave(event: DragEvent, compartmentId: string): void {
    if (this.dragOverCompartmentId === compartmentId) {
      this.dragOverCompartmentId = null;
    }
  }

  onDrop(event: DragEvent, containerId: string, toCompartmentId: string): void {
    event.preventDefault();
    if (this.draggedItem && this.draggedItem.compartmentId !== toCompartmentId) {
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
        const newPosition =
          targetCompartment.widthindexStart +
          dropPercent * (targetCompartment.widthindexEnd - targetCompartment.widthindexStart);

        this.containerService.moveItemBetweenCompartments(
          this.draggedItem.containerId,
          this.draggedItem.compartmentId,
          containerId,
          toCompartmentId,
          this.draggedItem.item.id,
          newPosition
        );
      }

      this.draggedItem = null;
    }
  }

  onDownload(compartment: Compartment): void {
    console.log('Download compartment', compartment.id);
  }

  onRefresh(): void {
    console.log('Refresh data');
  }
}
