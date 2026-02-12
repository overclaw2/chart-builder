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

  moveItem(fromContainerId: string, toContainerId: string, itemId: string): void {
    const currentData = this.shipDataSubject.value;
    let movedItem: Item | undefined;
    let updatedContainers = currentData.containers.map((c) => {
      if (c.id === fromContainerId) {
        const items = c.items.filter((item) => {
          if (item.id === itemId) {
            movedItem = item;
            return false;
          }
          return true;
        });
        return { ...c, items };
      }
      return c;
    });

    if (movedItem) {
      updatedContainers = updatedContainers.map((c) => {
        if (c.id === toContainerId) {
          return { ...c, items: [...c.items, movedItem!] };
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
