import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerService } from '../../core/services/container.service';
import { ShipData, Container, Item } from '../../core/models/container.model';

@Component({
  selector: 'app-container-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './container-visualization.component.html',
  styleUrls: ['./container-visualization.component.css'],
})
export class ContainerVisualizationComponent implements OnInit {
  shipData: ShipData | null = null;
  draggedItem: { containerId: string; item: Item } | null = null;

  constructor(private containerService: ContainerService) {}

  ngOnInit(): void {
    this.containerService.getShipData().subscribe((data) => {
      this.shipData = data;
    });
  }

  getItemPosition(item: Item, container: Container): { left: string; width: string } {
    const containerWidth = container.totalCapacity;
    const itemStart = item.position;
    const itemEnd = item.position + item.length;
    
    const leftPercent = (itemStart / containerWidth) * 100;
    const widthPercent = ((itemEnd - itemStart) / containerWidth) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  }

  onDragStart(
    event: DragEvent,
    containerId: string,
    item: Item
  ): void {
    this.draggedItem = { containerId, item };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, toContainerId: string): void {
    event.preventDefault();
    if (this.draggedItem && this.draggedItem.containerId !== toContainerId) {
      this.containerService.moveItem(
        this.draggedItem.containerId,
        toContainerId,
        this.draggedItem.item.id
      );
      this.draggedItem = null;
    }
  }

  onDownload(container: Container): void {
    console.log('Download container', container.id);
  }

  onRefresh(): void {
    console.log('Refresh data');
  }
}
