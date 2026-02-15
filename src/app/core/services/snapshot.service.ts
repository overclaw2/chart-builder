import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ShipData, Container, Compartment } from '../models/container.model';

export interface Snapshot {
  id: string;
  timestamp: number; // Unix timestamp
  label: string; // User-friendly name (e.g., "End of Hour 1", "Before major repack")
  shipData: ShipData;
  metadata: {
    totalWeight: number;
    totalWeightCapacity: number;
    totalWidth: number;
    totalWidthCapacity: number;
    itemCount: number;
    containerCount: number;
    averageUtilization: number;
  };
}

export interface SnapshotDiff {
  id: string;
  timestamp1: number;
  timestamp2: number;
  weightChange: number; // kg added/removed
  itemCountChange: number;
  compartmentDiffs: {
    compartmentId: string;
    compartmentIndex: number;
    containerName: string;
    weightChange: number;
    itemsAdded: number;
    itemsRemoved: number;
    itemsModified: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class SnapshotService {
  private snapshots$ = new BehaviorSubject<Snapshot[]>([]);
  private currentSnapshot$ = new BehaviorSubject<Snapshot | null>(null);

  constructor() {
    this.loadSnapshotsFromStorage();
  }

  /**
   * Create a new snapshot from current ship data
   */
  createSnapshot(shipData: ShipData, label?: string): Snapshot {
    const snapshot: Snapshot = {
      id: this.generateId(),
      timestamp: Date.now(),
      label: label || `Snapshot ${new Date(Date.now()).toLocaleTimeString()}`,
      shipData: JSON.parse(JSON.stringify(shipData)), // Deep clone
      metadata: this.calculateMetadata(shipData),
    };

    const current = this.snapshots$.getValue();
    current.push(snapshot);
    this.snapshots$.next(current);
    this.persistSnapshots();

    return snapshot;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): Observable<Snapshot[]> {
    return this.snapshots$.asObservable();
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(id: string): Snapshot | null {
    return this.snapshots$.getValue().find((s) => s.id === id) || null;
  }

  /**
   * Update snapshot label
   */
  updateSnapshotLabel(id: string, newLabel: string): void {
    const snapshots = this.snapshots$.getValue();
    const snapshot = snapshots.find((s) => s.id === id);
    if (snapshot) {
      snapshot.label = newLabel;
      this.snapshots$.next([...snapshots]);
      this.persistSnapshots();
    }
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(id: string): void {
    const snapshots = this.snapshots$.getValue().filter((s) => s.id !== id);
    this.snapshots$.next(snapshots);
    this.persistSnapshots();
  }

  /**
   * Restore snapshot (load it back into app)
   */
  restoreSnapshot(id: string): ShipData | null {
    const snapshot = this.getSnapshot(id);
    if (snapshot) {
      return JSON.parse(JSON.stringify(snapshot.shipData)); // Deep clone
    }
    return null;
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(id1: string, id2: string): SnapshotDiff | null {
    const snapshot1 = this.getSnapshot(id1);
    const snapshot2 = this.getSnapshot(id2);

    if (!snapshot1 || !snapshot2) return null;

    // Ensure snapshot1 is older than snapshot2
    let older = snapshot1;
    let newer = snapshot2;
    if (snapshot1.timestamp > snapshot2.timestamp) {
      older = snapshot2;
      newer = snapshot1;
    }

    const diff: SnapshotDiff = {
      id: `${older.id}-${newer.id}`,
      timestamp1: older.timestamp,
      timestamp2: newer.timestamp,
      weightChange: newer.metadata.totalWeight - older.metadata.totalWeight,
      itemCountChange: newer.metadata.itemCount - older.metadata.itemCount,
      compartmentDiffs: [],
    };

    // Calculate per-compartment diffs
    const compartmentMap = new Map<string, { old: Compartment; new: Compartment }>();

    // Map old compartments
    older.shipData.containers.forEach((container) => {
      container.compartments.forEach((comp) => {
        compartmentMap.set(comp.id, { old: comp, new: null as any });
      });
    });

    // Map new compartments
    newer.shipData.containers.forEach((container) => {
      container.compartments.forEach((comp) => {
        const existing = compartmentMap.get(comp.id);
        if (existing) {
          existing.new = comp;
        } else {
          compartmentMap.set(comp.id, { old: null as any, new: comp });
        }
      });
    });

    // Calculate diffs
    compartmentMap.forEach(({ old, new: newComp }, compartmentId) => {
      const oldWeight = old?.items.reduce((sum, item) => sum + item.weightKg, 0) || 0;
      const newWeight = newComp?.items.reduce((sum, item) => sum + item.weightKg, 0) || 0;
      const oldItemCount = old?.items.length || 0;
      const newItemCount = newComp?.items.length || 0;

      // Find container name
      let containerName = 'Unknown';
      newer.shipData.containers.forEach((container) => {
        const found = container.compartments.find((c) => c.id === compartmentId);
        if (found) {
          containerName = container.name;
        }
      });

      // Calculate item changes
      const oldItemIds = new Set((old?.items || []).map((i) => i.id));
      const newItemIds = new Set((newComp?.items || []).map((i) => i.id));

      const itemsAdded = Array.from(newItemIds).filter((id) => !oldItemIds.has(id)).length;
      const itemsRemoved = Array.from(oldItemIds).filter((id) => !newItemIds.has(id)).length;
      const itemsModified = Array.from(oldItemIds)
        .filter((id) => newItemIds.has(id))
        .filter((id) => {
          const oldItem = old?.items.find((i) => i.id === id);
          const newItem = newComp?.items.find((i) => i.id === id);
          return oldItem && newItem && (oldItem.position !== newItem.position || oldItem.color !== newItem.color);
        }).length;

      diff.compartmentDiffs.push({
        compartmentId,
        compartmentIndex: old?.index || newComp?.index || 0,
        containerName,
        weightChange: newWeight - oldWeight,
        itemsAdded,
        itemsRemoved,
        itemsModified,
      });
    });

    return diff;
  }

  /**
   * Export snapshots as JSON
   */
  exportSnapshots(): string {
    return JSON.stringify(this.snapshots$.getValue(), null, 2);
  }

  /**
   * Import snapshots from JSON
   */
  importSnapshots(json: string): boolean {
    try {
      const imported = JSON.parse(json) as Snapshot[];
      // Validate structure
      if (Array.isArray(imported) && imported.every((s) => s.id && s.timestamp && s.shipData)) {
        this.snapshots$.next(imported);
        this.persistSnapshots();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import snapshots:', e);
      return false;
    }
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots(): void {
    this.snapshots$.next([]);
    localStorage.removeItem('containerSnapshots');
  }

  /**
   * Get snapshot statistics
   */
  getSnapshotStats(): { count: number; oldestTime: number; newestTime: number; avgSize: number } {
    const snapshots = this.snapshots$.getValue();
    if (snapshots.length === 0) {
      return { count: 0, oldestTime: 0, newestTime: 0, avgSize: 0 };
    }

    const times = snapshots.map((s) => s.timestamp).sort((a, b) => a - b);
    const avgSize = snapshots.reduce((sum, s) => sum + JSON.stringify(s).length, 0) / snapshots.length;

    return {
      count: snapshots.length,
      oldestTime: times[0],
      newestTime: times[times.length - 1],
      avgSize: Math.round(avgSize),
    };
  }

  /**
   * Auto-create snapshot at regular intervals (for continuous monitoring)
   */
  autoSnapshot(shipData: ShipData, interval: number = 300000): () => void {
    const intervalId = setInterval(() => {
      const metadata = this.calculateMetadata(shipData);
      const hour = Math.floor(metadata.totalWeight / 100);
      this.createSnapshot(shipData, `Auto ${new Date().toLocaleTimeString()}`);
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // ===== PRIVATE HELPERS =====

  private calculateMetadata(shipData: ShipData) {
    let totalWeight = 0;
    let totalWeightCapacity = 0;
    let totalWidth = 0;
    let totalWidthCapacity = 0;
    let itemCount = 0;

    shipData.containers.forEach((container) => {
      container.compartments.forEach((comp) => {
        totalWeight += comp.items.reduce((sum, item) => sum + item.weightKg, 0);
        totalWeightCapacity += comp.totalCapacity;
        totalWidth += comp.widthMcm;
        totalWidthCapacity += comp.widthMcm;
        itemCount += comp.items.length;
      });
    });

    const averageUtilization = totalWeightCapacity > 0 ? (totalWeight / totalWeightCapacity) * 100 : 0;

    return {
      totalWeight,
      totalWeightCapacity,
      totalWidth,
      totalWidthCapacity,
      itemCount,
      containerCount: shipData.containers.length,
      averageUtilization: parseFloat(averageUtilization.toFixed(2)),
    };
  }

  private persistSnapshots(): void {
    const snapshots = this.snapshots$.getValue();
    localStorage.setItem('containerSnapshots', JSON.stringify(snapshots));
  }

  private loadSnapshotsFromStorage(): void {
    const stored = localStorage.getItem('containerSnapshots');
    if (stored) {
      try {
        const snapshots = JSON.parse(stored) as Snapshot[];
        this.snapshots$.next(snapshots);
      } catch (e) {
        console.warn('Failed to load snapshots from storage:', e);
      }
    }
  }

  private generateId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
