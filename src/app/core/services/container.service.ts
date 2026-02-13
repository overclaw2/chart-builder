import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Container, Item, ShipData } from '../models/container.model';

@Injectable({
  providedIn: 'root',
})
export class ContainerService {
  private shipDataSubject = new BehaviorSubject<ShipData>(this.getMockData());
  public shipData$ = this.shipDataSubject.asObservable();

  constructor() {
    // Try to load data from localStorage first
    const savedData = localStorage.getItem('shipData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as ShipData;
        this.shipDataSubject.next(parsedData);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
  }

  getMockData(): ShipData {
    return {
      title: 'Container Ship Status',
      containers: [
        {
          id: 'container-1',
          name: 'Container 1',
          ship: 'Ever Given',
          compartments: [
            {
              id: 'compartment-1',
              index: 1,
              widthindexStart: 10000,
              widthindexEnd: 10150,
              widthMcm: 150,
              widthUtilization: 18,
              weightKg: 1500,
              weightUtilization: 8.57,
              totalCapacity: 15000,
              items: [
                {
                  id: 'item-1',
                  name: 'Ali Express 10',
                  dimensionMcm: 27,
                  weightKg: 100,
                  destination: 'ISRAEL',
                  position: 10050,
                  length: 500,
                  displayIndex: 10050,
                },
              ],
            },
            {
              id: 'compartment-2',
              index: 2,
              widthindexStart: 10150,
              widthindexEnd: 10250,
              widthMcm: 100,
              widthUtilization: 30,
              weightKg: 1500,
              weightUtilization: 8.57,
              totalCapacity: 15000,
              items: [
                {
                  id: 'item-2',
                  name: 'Ali Express 10',
                  dimensionMcm: 30,
                  weightKg: 200,
                  destination: 'ISRAEL',
                  position: 10180,
                  length: 500,
                  displayIndex: 10180,
                },
              ],
            },
          ],
        },
        {
          id: 'container-2',
          name: 'Container 2',
          ship: 'Ever Given',
          compartments: [
            {
              id: 'compartment-3',
              index: 1,
              widthindexStart: 11000,
              widthindexEnd: 11200,
              widthMcm: 200,
              widthUtilization: 45,
              weightKg: 2200,
              weightUtilization: 12.57,
              totalCapacity: 17500,
              items: [
                {
                  id: 'item-3',
                  name: 'Amazon Box S',
                  dimensionMcm: 15,
                  weightKg: 75,
                  destination: 'USA',
                  position: 11030,
                  length: 500,
                  displayIndex: 11030,
                  color: '#60a5fa',
                },
                {
                  id: 'item-4',
                  name: 'Alibaba Large',
                  dimensionMcm: 45,
                  weightKg: 300,
                  destination: 'CHINA',
                  position: 11080,
                  length: 500,
                  displayIndex: 11080,
                  color: '#34d399',
                },
                {
                  id: 'item-5',
                  name: 'DHL Express',
                  dimensionMcm: 22,
                  weightKg: 85,
                  destination: 'GERMANY',
                  position: 11140,
                  length: 500,
                  displayIndex: 11140,
                  color: '#fbbf24',
                },
              ],
            },
            {
              id: 'compartment-4',
              index: 2,
              widthindexStart: 11200,
              widthindexEnd: 11350,
              widthMcm: 150,
              widthUtilization: 52,
              weightKg: 1800,
              weightUtilization: 10.29,
              totalCapacity: 17500,
              items: [
                {
                  id: 'item-6',
                  name: 'FedEx Package',
                  dimensionMcm: 35,
                  weightKg: 150,
                  destination: 'CANADA',
                  position: 11220,
                  length: 500,
                  displayIndex: 11220,
                  color: '#f87171',
                },
                {
                  id: 'item-7',
                  name: 'DPD Small',
                  dimensionMcm: 12,
                  weightKg: 40,
                  destination: 'FRANCE',
                  position: 11270,
                  length: 500,
                  displayIndex: 11270,
                  color: '#a78bfa',
                },
                {
                  id: 'item-8',
                  name: 'UPS Large',
                  dimensionMcm: 42,
                  weightKg: 280,
                  destination: 'UK',
                  position: 11295,
                  length: 500,
                  displayIndex: 11295,
                  color: '#fb923c',
                },
              ],
            },
          ],
        },
      ],
    };
  }

  getShipData(): Observable<ShipData> {
    return this.shipData$;
  }

  loadDataFromJSON(jsonData: any): void {
    try {
      // Validate and normalize input structure
      let normalizedData: ShipData;

      if (jsonData && typeof jsonData === 'object') {
        let dataToProcess = jsonData;
        
        // FIX: Handle wrapped data structures (e.g., { data: { containers: [...] } })
        if (!Array.isArray(jsonData) && !jsonData.containers) {
          // Check for common wrapper properties like 'data'
          if (jsonData.data && typeof jsonData.data === 'object') {
            dataToProcess = jsonData.data;
          }
        }

        if (Array.isArray(dataToProcess)) {
          // Raw array of containers - wrap it
          normalizedData = {
            title: 'Container Ship Status',
            containers: dataToProcess,
          };
        } else if (dataToProcess.containers && Array.isArray(dataToProcess.containers)) {
          // Standard ShipData format with containers array
          normalizedData = {
            title: dataToProcess.title || 'Container Ship Status',
            containers: dataToProcess.containers,
          };
        } else {
          // Unknown structure - provide detailed diagnostic
          const keys = Object.keys(dataToProcess);
          const hasContainers = 'containers' in dataToProcess;
          const containersIsArray = Array.isArray(dataToProcess.containers);
          
          throw new Error(
            `Invalid data structure: Expected { containers: Array, title?: string }. ` +
            `Received object with keys: [${keys.join(', ')}]. ` +
            (hasContainers && !containersIsArray ? 
              `Note: 'containers' property exists but is not an array (type: ${typeof dataToProcess.containers}).` :
              `Note: No 'containers' property found.`)
          );
        }
      } else {
        // Not an object or array
        throw new Error(`Invalid data structure: Expected object or array, received ${typeof jsonData}`);
      }

      // Validate that containers is an array with valid structure
      if (!Array.isArray(normalizedData.containers)) {
        throw new Error('Invalid data structure: containers must be an array');
      }

      if (normalizedData.containers.length === 0) {
        throw new Error('Invalid data structure: containers array is empty');
      }

      // Validate at least one container has the expected structure
      const firstContainer = normalizedData.containers[0];
      if (!firstContainer || typeof firstContainer !== 'object') {
        throw new Error('Invalid container structure: containers must contain valid objects');
      }
      
      if (!firstContainer.compartments || !Array.isArray(firstContainer.compartments)) {
        throw new Error(
          'Invalid container structure: each container must have a compartments array. ' +
          `First container has keys: [${Object.keys(firstContainer).join(', ')}]`
        );
      }

      if (firstContainer.compartments.length === 0) {
        throw new Error('Invalid container structure: compartments array cannot be empty');
      }

      // Save to localStorage for persistence
      localStorage.setItem('shipData', JSON.stringify(normalizedData));
      
      // Update the subject
      this.shipDataSubject.next(normalizedData);
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  loadDataFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string) as ShipData;
          this.loadDataFromJSON(jsonData);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  resetToMockData(): void {
    localStorage.removeItem('shipData');
    const mockData = this.getMockData();
    // Initialize orderIndex for mock data
    mockData.containers.forEach((container, index) => {
      container.orderIndex = index;
    });
    this.shipDataSubject.next(mockData);
  }

  reorderContainers(fromIndex: number, toIndex: number): void {
    const currentData = this.shipDataSubject.value;
    const containers = [...currentData.containers];
    
    // Move container from fromIndex to toIndex
    const [movedContainer] = containers.splice(fromIndex, 1);
    containers.splice(toIndex, 0, movedContainer);
    
    // Update orderIndex for all containers
    containers.forEach((container, index) => {
      container.orderIndex = index;
    });
    
    // Save to localStorage
    const updatedData = {
      ...currentData,
      containers
    };
    localStorage.setItem('shipData', JSON.stringify(updatedData));
    this.shipDataSubject.next(updatedData);
  }

  moveContainerUp(containerId: string): void {
    const currentData = this.shipDataSubject.value;
    const currentIndex = currentData.containers.findIndex(c => c.id === containerId);
    
    if (currentIndex > 0) {
      this.reorderContainers(currentIndex, currentIndex - 1);
    }
  }

  moveContainerDown(containerId: string): void {
    const currentData = this.shipDataSubject.value;
    const currentIndex = currentData.containers.findIndex(c => c.id === containerId);
    
    if (currentIndex < currentData.containers.length - 1) {
      this.reorderContainers(currentIndex, currentIndex + 1);
    }
  }

  // Collision Detection Methods
  doesItemOverlapWithOthers(
    compartmentId: string,
    itemPosition: number,
    itemWidth: number,
    excludeItemId?: string
  ): boolean {
    const currentData = this.shipDataSubject.value;
    
    // Find the compartment
    let targetCompartment: any = null;
    for (const container of currentData.containers) {
      const comp = container.compartments.find(c => c.id === compartmentId);
      if (comp) {
        targetCompartment = comp;
        break;
      }
    }
    
    if (!targetCompartment) {
      return false;
    }
    
    // Check collision with existing items
    for (const item of targetCompartment.items) {
      // Skip the item being moved
      if (excludeItemId && item.id === excludeItemId) {
        continue;
      }
      
      const itemEnd = itemPosition + itemWidth;
      const existingItemEnd = item.position + (item.dimensionMcm || 27);
      
      // Check if there's any overlap
      const hasOverlap = itemPosition < existingItemEnd && itemEnd > item.position;
      
      if (hasOverlap) {
        return true;
      }
    }
    
    return false;
  }

  getNextAvailablePosition(
    compartmentId: string,
    itemWidth: number,
    compartmentStart: number,
    compartmentEnd: number
  ): number | null {
    const currentData = this.shipDataSubject.value;
    
    // Find the compartment
    let targetCompartment: any = null;
    for (const container of currentData.containers) {
      const comp = container.compartments.find(c => c.id === compartmentId);
      if (comp) {
        targetCompartment = comp;
        break;
      }
    }
    
    if (!targetCompartment || targetCompartment.items.length === 0) {
      // Compartment is empty, position at start
      return compartmentStart;
    }
    
    // Sort items by position
    const sortedItems = [...targetCompartment.items].sort((a, b) => a.position - b.position);
    
    // Check if there's space before the first item
    if (sortedItems[0].position - compartmentStart >= itemWidth) {
      return compartmentStart;
    }
    
    // Find gaps between items
    for (let i = 0; i < sortedItems.length - 1; i++) {
      const currentItemEnd = sortedItems[i].position + (sortedItems[i].dimensionMcm || 27);
      const nextItemStart = sortedItems[i + 1].position;
      const gapSize = nextItemStart - currentItemEnd;
      
      if (gapSize >= itemWidth) {
        return currentItemEnd;
      }
    }
    
    // Check space after the last item
    const lastItem = sortedItems[sortedItems.length - 1];
    const lastItemEnd = lastItem.position + (lastItem.dimensionMcm || 27);
    if (compartmentEnd - lastItemEnd >= itemWidth) {
      return lastItemEnd;
    }
    
    return null; // No available space
  }

  updateContainer(container: Container): void {
    const currentData = this.shipDataSubject.value;
    const updatedContainers = currentData.containers.map((c) =>
      c.id === container.id ? container : c
    );
    this.shipDataSubject.next({
      ...currentData,
      containers: updatedContainers,
    });
  }

  updateItemPositionInCompartment(
    containerId: string,
    compartmentId: string,
    itemId: string,
    newPosition: number,
    displayIndex?: number
  ): void {
    const currentData = this.shipDataSubject.value;

    const updatedContainers = currentData.containers.map((container) => {
      if (container.id === containerId) {
        const updatedCompartments = container.compartments.map((compartment) => {
          if (compartment.id === compartmentId) {
            const items = compartment.items.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  position: newPosition,
                  displayIndex: displayIndex,
                };
              }
              return item;
            });

            return {
              ...compartment,
              items,
            };
          }
          return compartment;
        });

        return {
          ...container,
          compartments: updatedCompartments,
        };
      }
      return container;
    });

    this.shipDataSubject.next({
      ...currentData,
      containers: updatedContainers,
    });
  }

  removeItemFromCompartment(
    containerId: string,
    compartmentId: string,
    itemId: string
  ): void {
    const currentData = this.shipDataSubject.value;

    const updatedContainers = currentData.containers.map((container) => {
      if (container.id === containerId) {
        const updatedCompartments = container.compartments.map((compartment) => {
          if (compartment.id === compartmentId) {
            let removedItemWeight = 0;
            let removedItemWidth = 0;

            const items = compartment.items.filter((item) => {
              if (item.id === itemId) {
                removedItemWeight = item.weightKg;
                removedItemWidth = item.dimensionMcm || 27;
                return false;
              }
              return true;
            });

            const newWeight = compartment.weightKg - removedItemWeight;
            const newUtilization = (newWeight / compartment.totalCapacity) * 100;
            
            // Recalculate widthUtilization using dimensionMcm
            const totalPackageWidth = items.reduce((sum, item) => sum + (item.dimensionMcm || 27), 0);
            const newWidthUtilization = (totalPackageWidth / compartment.widthMcm) * 100;

            return {
              ...compartment,
              items,
              weightKg: newWeight,
              weightUtilization: parseFloat(newUtilization.toFixed(2)),
              widthUtilization: parseFloat(newWidthUtilization.toFixed(1)),
            };
          }
          return compartment;
        });

        return {
          ...container,
          compartments: updatedCompartments,
        };
      }
      return container;
    });

    this.shipDataSubject.next({
      ...currentData,
      containers: updatedContainers,
    });
  }

  moveItemBetweenCompartments(
    fromContainerId: string,
    fromCompartmentId: string,
    toContainerId: string,
    toCompartmentId: string,
    itemId: string,
    newPosition?: number,
    displayIndex?: number
  ): void {
    const currentData = this.shipDataSubject.value;
    let movedItem: Item | undefined;
    let itemWeight = 0;
    let itemWidth = 0;
    let targetCompartmentData: any;

    // Find target compartment to get its range for validation
    const targetContainer = currentData.containers.find((c) => c.id === toContainerId);
    if (targetContainer) {
      targetCompartmentData = targetContainer.compartments.find((comp) => comp.id === toCompartmentId);
    }

    // Update containers
    let updatedContainers = currentData.containers.map((container) => {
      if (container.id === fromContainerId || container.id === toContainerId) {
        const updatedCompartments = container.compartments.map((compartment) => {
          // Remove from source compartment
          if (compartment.id === fromCompartmentId) {
            const items = compartment.items.filter((item) => {
              if (item.id === itemId) {
                movedItem = { ...item };
                itemWeight = item.weightKg;
                itemWidth = item.dimensionMcm || 27; // FIX: Use dimensionMcm for width calculation
                if (newPosition !== undefined) {
                  movedItem.position = newPosition;
                }
                return false;
              }
              return true;
            });

            const newWeight = compartment.weightKg - itemWeight;
            const newUtilization = (newWeight / compartment.totalCapacity) * 100;
            
            // FIX: Recalculate widthUtilization using dimensionMcm instead of length
            const totalPackageWidth = items.reduce((sum, item) => sum + (item.dimensionMcm || 27), 0);
            const newWidthUtilization = (totalPackageWidth / compartment.widthMcm) * 100;

            return {
              ...compartment,
              items,
              weightKg: newWeight,
              weightUtilization: parseFloat(newUtilization.toFixed(2)),
              widthUtilization: parseFloat(newWidthUtilization.toFixed(1)),
            };
          }

          // Add to target compartment
          if (compartment.id === toCompartmentId && movedItem) {
            // FIX: Properly validate and clamp position to compartment range
            let finalPosition = newPosition;
            
            if (finalPosition === undefined || finalPosition === null) {
              // Default position: center of compartment
              finalPosition =
                compartment.widthindexStart +
                (compartment.widthindexEnd - compartment.widthindexStart) / 2;
            } else {
              // Clamp position to ensure it's within compartment bounds
              // Leave margin for item width to avoid extending beyond compartment
              const itemDimension = movedItem.dimensionMcm || 27;
              const minPosition = compartment.widthindexStart;
              const compartmentEnd = compartment.widthindexEnd;
              
              // FIX: When item is larger than compartment, allow it to overflow slightly
              // but keep it mostly within bounds. This prevents invisible items.
              let maxPosition = compartmentEnd - itemDimension;
              
              // If item is larger than compartment, ensure position is reasonable
              // Position item to start at or near the compartment start
              if (itemDimension > (compartmentEnd - minPosition)) {
                // Item is too large for compartment - position at start
                finalPosition = minPosition;
              } else {
                // Normal clamping
                finalPosition = Math.max(minPosition, Math.min(finalPosition, maxPosition));
              }
            }
            
            movedItem.position = finalPosition;
            
            // Set displayIndex to final position if not explicitly provided
            if (displayIndex !== undefined) {
              movedItem.displayIndex = displayIndex;
            } else {
              movedItem.displayIndex = Math.round(finalPosition);
            }

            const newItems = [...compartment.items, movedItem];
            const newWeight = compartment.weightKg + itemWeight;
            const newUtilization = (newWeight / compartment.totalCapacity) * 100;
            
            // FIX: Calculate widthUtilization using dimensionMcm (package width) instead of length
            const totalPackageWidth = newItems.reduce((sum, item) => sum + (item.dimensionMcm || 27), 0);
            const newWidthUtilization = (totalPackageWidth / compartment.widthMcm) * 100;

            return {
              ...compartment,
              items: newItems,
              weightKg: newWeight,
              weightUtilization: parseFloat(newUtilization.toFixed(2)),
              widthUtilization: parseFloat(newWidthUtilization.toFixed(1)),
            };
          }

          return compartment;
        });

        return {
          ...container,
          compartments: updatedCompartments,
        };
      }
      return container;
    });

    this.shipDataSubject.next({
      ...currentData,
      containers: updatedContainers,
    });
  }
}
