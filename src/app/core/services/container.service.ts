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
                  position: 13768.6,
                  length: 500,
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
                  position: 14085.2,
                  length: 500,
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

  moveItemBetweenCompartments(
    fromContainerId: string,
    fromCompartmentId: string,
    toContainerId: string,
    toCompartmentId: string,
    itemId: string,
    newPosition?: number
  ): void {
    const currentData = this.shipDataSubject.value;
    let movedItem: Item | undefined;
    let itemWeight = 0;

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
            const targetPosition =
              newPosition ||
              compartment.widthindexStart + 1000 + compartment.items.length * 600;
            movedItem.position = targetPosition;

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
