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
              widthMcm: 120,
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
      ],
    };
  }

  getShipData(): Observable<ShipData> {
    return this.shipData$;
  }

  loadDataFromJSON(jsonData: ShipData): void {
    try {
      // Validate basic structure
      if (!jsonData.containers || !Array.isArray(jsonData.containers)) {
        throw new Error('Invalid data structure: missing containers array');
      }

      // Save to localStorage for persistence
      localStorage.setItem('shipData', JSON.stringify(jsonData));
      
      // Update the subject
      this.shipDataSubject.next(jsonData);
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
    this.shipDataSubject.next(this.getMockData());
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
                if (newPosition !== undefined) {
                  movedItem.position = newPosition;
                }
                return false;
              }
              return true;
            });

            const newWeight = compartment.weightKg - itemWeight;
            const newUtilization = (newWeight / 17500) * 100;

            return {
              ...compartment,
              items,
              weightKg: newWeight,
              weightUtilization: parseFloat(newUtilization.toFixed(2)),
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
              // Leave margin for item width
              const itemDimension = movedItem.dimensionMcm || 27;
              const minPosition = compartment.widthindexStart;
              const maxPosition = compartment.widthindexEnd - itemDimension;
              
              finalPosition = Math.max(minPosition, Math.min(finalPosition, maxPosition));
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
            const newUtilization = (newWeight / 17500) * 100;
            const totalItemLength = newItems.reduce((sum, item) => sum + item.length, 0);
            const newWidthUtilization = (totalItemLength / compartment.totalCapacity) * 100;

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
