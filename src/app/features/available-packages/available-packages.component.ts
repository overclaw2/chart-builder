import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Item } from '../../core/models/container.model';

@Component({
  selector: 'app-available-packages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-packages.component.html',
  styleUrls: ['./available-packages.component.css'],
})
export class AvailablePackagesComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() dragStart = new EventEmitter<{ item: Item; event: DragEvent }>();
  @Output() packageRemoved = new EventEmitter<Item>();
  @Output() packageAdded = new EventEmitter<Item>();

  availablePackages: Item[] = [];
  draggedPackage: Item | null = null;
  searchQuery: string = '';
  searchOpen: boolean = false;

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
      // Additional 20 packages with width 5-20
      {
        id: 'available-pkg-7',
        name: 'Small Parts Box',
        dimensionMcm: 8,
        weightKg: 45,
        destination: 'SINGAPORE',
        position: 0,
        length: 500,
        color: '#c7d2fe',
      },
      {
        id: 'available-pkg-8',
        name: 'Electronics Kit',
        dimensionMcm: 12,
        weightKg: 65,
        destination: 'THAILAND',
        position: 0,
        length: 500,
        color: '#fbcfe8',
      },
      {
        id: 'available-pkg-9',
        name: 'Compact Device',
        dimensionMcm: 6,
        weightKg: 35,
        destination: 'VIETNAM',
        position: 0,
        length: 500,
        color: '#ddd6fe',
      },
      {
        id: 'available-pkg-10',
        name: 'Module Pack',
        dimensionMcm: 15,
        weightKg: 80,
        destination: 'PHILIPPINES',
        position: 0,
        length: 500,
        color: '#fecaca',
      },
      {
        id: 'available-pkg-11',
        name: 'Spare Parts',
        dimensionMcm: 10,
        weightKg: 55,
        destination: 'INDONESIA',
        position: 0,
        length: 500,
        color: '#f0fdf4',
      },
      {
        id: 'available-pkg-12',
        name: 'Accessory Set',
        dimensionMcm: 7,
        weightKg: 40,
        destination: 'MALAYSIA',
        position: 0,
        length: 500,
        color: '#fef3c7',
      },
      {
        id: 'available-pkg-13',
        name: 'Component Box',
        dimensionMcm: 14,
        weightKg: 75,
        destination: 'SINGAPORE',
        position: 0,
        length: 500,
        color: '#bfdbfe',
      },
      {
        id: 'available-pkg-14',
        name: 'Micro Devices',
        dimensionMcm: 5,
        weightKg: 30,
        destination: 'THAILAND',
        position: 0,
        length: 500,
        color: '#e0e7ff',
      },
      {
        id: 'available-pkg-15',
        name: 'Small Hardware',
        dimensionMcm: 9,
        weightKg: 50,
        destination: 'VIETNAM',
        position: 0,
        length: 500,
        color: '#f5d1d1',
      },
      {
        id: 'available-pkg-16',
        name: 'Cable Bundle',
        dimensionMcm: 11,
        weightKg: 60,
        destination: 'PHILIPPINES',
        position: 0,
        length: 500,
        color: '#d1f2eb',
      },
      {
        id: 'available-pkg-17',
        name: 'Panel Set',
        dimensionMcm: 18,
        weightKg: 95,
        destination: 'INDONESIA',
        position: 0,
        length: 500,
        color: '#fce7f3',
      },
      {
        id: 'available-pkg-18',
        name: 'Connector Pack',
        dimensionMcm: 6,
        weightKg: 35,
        destination: 'MALAYSIA',
        position: 0,
        length: 500,
        color: '#f3e8ff',
      },
      {
        id: 'available-pkg-19',
        name: 'Adapter Kit',
        dimensionMcm: 13,
        weightKg: 70,
        destination: 'SINGAPORE',
        position: 0,
        length: 500,
        color: '#fef08a',
      },
      {
        id: 'available-pkg-20',
        name: 'Mounting Frame',
        dimensionMcm: 17,
        weightKg: 90,
        destination: 'THAILAND',
        position: 0,
        length: 500,
        color: '#ccfbf1',
      },
      {
        id: 'available-pkg-21',
        name: 'Sensor Module',
        dimensionMcm: 8,
        weightKg: 42,
        destination: 'VIETNAM',
        position: 0,
        length: 500,
        color: '#dbeafe',
      },
      {
        id: 'available-pkg-22',
        name: 'Control Board',
        dimensionMcm: 16,
        weightKg: 85,
        destination: 'PHILIPPINES',
        position: 0,
        length: 500,
        color: '#fda7df',
      },
      {
        id: 'available-pkg-23',
        name: 'Relay Unit',
        dimensionMcm: 7,
        weightKg: 38,
        destination: 'INDONESIA',
        position: 0,
        length: 500,
        color: '#e0f2fe',
      },
      {
        id: 'available-pkg-24',
        name: 'Resistor Pack',
        dimensionMcm: 5,
        weightKg: 28,
        destination: 'MALAYSIA',
        position: 0,
        length: 500,
        color: '#fed7aa',
      },
      {
        id: 'available-pkg-25',
        name: 'Capacitor Batch',
        dimensionMcm: 10,
        weightKg: 52,
        destination: 'SINGAPORE',
        position: 0,
        length: 500,
        color: '#d4fc79',
      },
      {
        id: 'available-pkg-26',
        name: 'Diode Assembly',
        dimensionMcm: 20,
        weightKg: 105,
        destination: 'THAILAND',
        position: 0,
        length: 500,
        color: '#fce7f3',
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
    return this.getDisplayData().length;
  }

  toggleSearchOpen(): void {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
  }

  matchesSearch(item: Item): boolean {
    if (!this.searchQuery.trim()) {
      return true;
    }
    
    const query = this.searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.destination.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.weightKg.toString().includes(query) ||
      item.dimensionMcm.toString().includes(query)
    );
  }

  getDisplayData(): Item[] {
    return this.availablePackages.filter(item => this.matchesSearch(item));
  }

  /**
   * Remove a package from the available packages list (when it's placed in a container)
   */
  removePackageFromAvailable(packageId: string): void {
    const index = this.availablePackages.findIndex(p => p.id === packageId);
    if (index !== -1) {
      const removedPackage = this.availablePackages.splice(index, 1)[0];
      this.packageRemoved.emit(removedPackage);
    }
  }

  /**
   * Add a package back to the available packages list (when it's removed from a container)
   */
  addPackageToAvailable(item: Item): void {
    // Only add if it's not already in the list
    const alreadyExists = this.availablePackages.some(p => p.id === item.id);
    if (!alreadyExists) {
      this.availablePackages.push(item);
      this.packageAdded.emit(item);
    }
  }
}
