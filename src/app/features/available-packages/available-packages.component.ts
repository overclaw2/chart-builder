import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Item } from '../../core/models/container.model';

@Component({
  selector: 'app-available-packages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './available-packages.component.html',
  styleUrls: ['./available-packages.component.css'],
})
export class AvailablePackagesComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() dragStart = new EventEmitter<{ item: Item; event: DragEvent }>();

  availablePackages: Item[] = [];
  draggedPackage: Item | null = null;

  ngOnInit(): void {
    this.initializeAvailablePackages();
  }

  /**
   * Initialize available packages pool - these are packages that can be dragged to containers
   * In a real app, this would come from a backend service
   */
  private initializeAvailablePackages(): void {
    this.availablePackages = [
      {
        id: 'available-pkg-1',
        name: 'Xiaomi Package',
        dimensionMcm: 35,
        weightKg: 180,
        destination: 'SINGAPORE',
        position: 0,
        length: 500,
        color: '#a1d8ff',
      },
      {
        id: 'available-pkg-2',
        name: 'Samsung Box',
        dimensionMcm: 42,
        weightKg: 220,
        destination: 'THAILAND',
        position: 0,
        length: 500,
        color: '#94f3f5',
      },
      {
        id: 'available-pkg-3',
        name: 'Sony Electronics',
        dimensionMcm: 28,
        weightKg: 150,
        destination: 'VIETNAM',
        position: 0,
        length: 500,
        color: '#86efac',
      },
      {
        id: 'available-pkg-4',
        name: 'LG Appliance',
        dimensionMcm: 55,
        weightKg: 350,
        destination: 'PHILIPPINES',
        position: 0,
        length: 500,
        color: '#fca5a5',
      },
      {
        id: 'available-pkg-5',
        name: 'Panasonic Device',
        dimensionMcm: 25,
        weightKg: 120,
        destination: 'INDONESIA',
        position: 0,
        length: 500,
        color: '#fed7aa',
      },
      {
        id: 'available-pkg-6',
        name: 'Toshiba Equipment',
        dimensionMcm: 38,
        weightKg: 190,
        destination: 'MALAYSIA',
        position: 0,
        length: 500,
        color: '#d1d5db',
      },
    ];
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  onDragStart(event: DragEvent, item: Item): void {
    this.draggedPackage = item;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify({
        isFromAvailablePackages: true,
        item,
      }));
    }
    this.dragStart.emit({ item, event });
  }

  onDragEnd(): void {
    this.draggedPackage = null;
  }

  getPackageColor(item: Item): string {
    return item.color || '#7dd3fc';
  }

  getTotalAvailablePackages(): number {
    return this.availablePackages.length;
  }
}
