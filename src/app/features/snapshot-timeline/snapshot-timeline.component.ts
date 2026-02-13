import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SnapshotService, Snapshot, SnapshotDiff } from '../../core/services/snapshot.service';
import { ShipData } from '../../core/models/container.model';

@Component({
  selector: 'app-snapshot-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './snapshot-timeline.component.html',
  styleUrls: ['./snapshot-timeline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotTimelineComponent implements OnInit {
  @Input() shipData: ShipData | null = null;
  @Output() snapshotRestored = new EventEmitter<ShipData>();

  snapshots: Snapshot[] = [];
  selectedSnapshot1: Snapshot | null = null;
  selectedSnapshot2: Snapshot | null = null;
  snapshotDiff: SnapshotDiff | null = null;
  newSnapshotLabel: string = '';
  showComparisonView: boolean = false;
  editingSnapshotId: string | null = null;

  constructor(private snapshotService: SnapshotService) {}

  ngOnInit(): void {
    this.snapshotService.getSnapshots().subscribe((snapshots) => {
      this.snapshots = snapshots;
    });
  }

  /**
   * Create a new snapshot
   */
  createSnapshot(): void {
    if (!this.shipData) return;

    const label = this.newSnapshotLabel.trim() || undefined;
    this.snapshotService.createSnapshot(this.shipData, label);
    this.newSnapshotLabel = '';
  }

  /**
   * Restore a snapshot (load it back into the app)
   */
  restoreSnapshot(snapshotId: string): void {
    const restored = this.snapshotService.restoreSnapshot(snapshotId);
    if (restored) {
      this.snapshotRestored.emit(restored);
    }
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): void {
    if (confirm('Are you sure you want to delete this snapshot?')) {
      this.snapshotService.deleteSnapshot(snapshotId);
    }
  }

  /**
   * Select snapshot for comparison
   */
  selectForComparison(snapshot: Snapshot, slot: 1 | 2): void {
    if (slot === 1) {
      this.selectedSnapshot1 = this.selectedSnapshot1?.id === snapshot.id ? null : snapshot;
    } else {
      this.selectedSnapshot2 = this.selectedSnapshot2?.id === snapshot.id ? null : snapshot;
    }

    this.updateComparison();
  }

  /**
   * Update comparison when snapshots change
   */
  private updateComparison(): void {
    if (this.selectedSnapshot1 && this.selectedSnapshot2) {
      this.snapshotDiff = this.snapshotService.compareSnapshots(
        this.selectedSnapshot1.id,
        this.selectedSnapshot2.id
      );
      this.showComparisonView = true;
    } else {
      this.snapshotDiff = null;
      this.showComparisonView = false;
    }
  }

  /**
   * Format timestamp to readable string
   */
  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Format duration between two timestamps
   */
  formatDuration(timestamp1: number, timestamp2: number): string {
    const diffMs = Math.abs(timestamp2 - timestamp1);
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get color for weight change
   */
  getWeightChangeColor(change: number): string {
    if (change > 0) return '#4ade80'; // green (weight added)
    if (change < 0) return '#ef4444'; // red (weight removed)
    return '#94a3b8'; // gray (no change)
  }

  /**
   * Start editing snapshot label
   */
  startEditingLabel(snapshotId: string): void {
    this.editingSnapshotId = snapshotId;
  }

  /**
   * Save edited snapshot label
   */
  saveEditingLabel(snapshotId: string, newLabel: string): void {
    if (newLabel.trim()) {
      this.snapshotService.updateSnapshotLabel(snapshotId, newLabel.trim());
    }
    this.editingSnapshotId = null;
  }

  /**
   * Export all snapshots as JSON
   */
  exportSnapshots(): void {
    const json = this.snapshotService.exportSnapshots();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snapshots-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import snapshots from JSON
   */
  importSnapshots(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      if (this.snapshotService.importSnapshots(json)) {
        alert('Snapshots imported successfully!');
      } else {
        alert('Failed to import snapshots. Invalid format.');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots(): void {
    if (confirm('Are you sure you want to delete ALL snapshots? This cannot be undone.')) {
      this.snapshotService.clearAllSnapshots();
      this.selectedSnapshot1 = null;
      this.selectedSnapshot2 = null;
      this.snapshotDiff = null;
    }
  }

  /**
   * Get snapshot statistics
   */
  getStats() {
    return this.snapshotService.getSnapshotStats();
  }
}
