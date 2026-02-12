import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Container, Item, ShipData } from '../models/container.model';

@Injectable({
  providedIn: 'root',
})
export class ContainerService {
  private shipDataSubject = new BehaviorSubject<ShipData>(this.getMockData());
  public shipData$ = this.shipDataSubject.asObservable();

  constructor() {}

  getMockData(): ShipData {
    return {
      title: 'Container Ship Status',
      containers: [
        {
          id: 'container-1',
          name: 'Container 1',
          ship: 'Ever Given',
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
              position: 13768.6,
              length: 500,
            },
          ],
        },
        {
          id: 'container-2',
          name: 'Container 2',
          ship: 'Ever Given',
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
              position: 14085.2,
              length: 500,
            },
          ],
        },
      ],
    };
  }

  getShipData(): Observable<ShipData> {
    return this.shipData$;
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

  moveItem(fromContainerId: string, toContainerId: string, itemId: string, newPosition?: number): void {
    const currentData = this.shipDataSubject.value;
    let movedItem: Item | undefined;
    let fromContainerWeight = 0;
    let fromContainerUtilization = 0;
    let toContainerWeight = 0;
    let toContainerUtilization = 0;

    // Remove item from source container and get its weight
    let updatedContainers = currentData.containers.map((c) => {
      if (c.id === fromContainerId) {
        const items = c.items.filter((item) => {
          if (item.id === itemId) {
            movedItem = { ...item };
            if (newPosition !== undefined) {
              movedItem.position = newPosition;
            }
            fromContainerWeight = item.weightKg;
            return false;
          }
          return true;
        });

        // Recalculate utilization for source container
        const newWeight = c.weightKg - fromContainerWeight;
        const newUtilization = (newWeight / 17500) * 100; // Max weight typically 17.5 tonnes

        return {
          ...c,
          items,
          weightKg: newWeight,
          weightUtilization: parseFloat(newUtilization.toFixed(2)),
        };
      }
      return c;
    });

    // Add item to target container
    if (movedItem) {
      updatedContainers = updatedContainers.map((c) => {
        if (c.id === toContainerId) {
          toContainerWeight = movedItem!.weightKg;

          // Position item at reasonable location in target container
          const targetPosition = newPosition || c.widthindexStart + 1000 + c.items.length * 600;
          movedItem!.position = targetPosition;

          const newItems = [...c.items, movedItem!];
          const newWeight = c.weightKg + toContainerWeight;
          const newUtilization = (newWeight / 17500) * 100;

          // Recalculate width utilization based on items
          const totalItemLength = newItems.reduce((sum, item) => sum + item.length, 0);
          const newWidthUtilization = (totalItemLength / c.totalCapacity) * 100;

          return {
            ...c,
            items: newItems,
            weightKg: newWeight,
            weightUtilization: parseFloat(newUtilization.toFixed(2)),
            widthUtilization: parseFloat(newWidthUtilization.toFixed(1)),
          };
        }
        return c;
      });
    }

    this.shipDataSubject.next({
      ...currentData,
      containers: updatedContainers,
    });
  }
}
