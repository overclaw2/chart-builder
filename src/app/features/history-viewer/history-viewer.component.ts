import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UndoRedoService, UndoRedoOperation } from '../../core/services/undo-redo.service';

@Component({
  selector: 'app-history-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-viewer.component.html',
  styleUrls: ['./history-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryViewerComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() stateSelected = new EventEmitter<number>();

  history: UndoRedoOperation[] = [];
  currentIndex: number = -1;
  viewMode: 'timeline' | 'list' = 'timeline';

  constructor(private undoRedoService: UndoRedoService) {}

  ngOnInit(): void {
    this.undoRedoService.operationStack$.subscribe((ops) => {
      this.history = ops;
    });

    this.undoRedoService.currentIndex$.subscribe((index) => {
      this.currentIndex = index;
    });
  }

  onJumpToState(index: number): void {
    this.undoRedoService.jumpToOperation(index);
    this.stateSelected.emit(index);
  }

  onUndo(): void {
    this.undoRedoService.undo();
  }

  onRedo(): void {
    this.undoRedoService.redo();
  }

  canUndo(): boolean {
    return this.undoRedoService.canUndo();
  }

  canRedo(): boolean {
    return this.undoRedoService.canRedo();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'timeline' ? 'list' : 'timeline';
  }

  closeViewer(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  getOperationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'drag': '🔄',
      'add': '➕',
      'remove': '➖',
      'color-change': '🎨',
      'bulk-import': '📦',
      'reset': '🔄'
    };
    return icons[type] || '•';
  }

  getOperationColor(type: string): string {
    const colors: { [key: string]: string } = {
      'drag': '#2196F3',
      'add': '#4CAF50',
      'remove': '#F44336',
      'color-change': '#FF9800',
      'bulk-import': '#9C27B0',
      'reset': '#757575'
    };
    return colors[type] || '#999';
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  isCurrentState(index: number): boolean {
    return index === this.currentIndex;
  }

  isFutureState(index: number): boolean {
    return index > this.currentIndex;
  }
}
