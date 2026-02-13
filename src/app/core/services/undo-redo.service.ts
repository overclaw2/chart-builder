import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ShipData, Container, Compartment, Item } from '../models/container.model';

export interface UndoRedoOperation {
  id: string;
  timestamp: number;
  type: 'drag' | 'add' | 'remove' | 'color-change' | 'bulk-import' | 'reset';
  description: string;
  before: ShipData;
  after: ShipData;
  itemId?: string;
  itemName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UndoRedoService {
  private operationStack: UndoRedoOperation[] = [];
  private currentIndex: number = -1;
  private maxStackSize: number = 100; // Keep last 100 operations

  private operationStackSubject = new BehaviorSubject<UndoRedoOperation[]>([]);
  private currentIndexSubject = new BehaviorSubject<number>(-1);

  operationStack$: Observable<UndoRedoOperation[]> = this.operationStackSubject.asObservable();
  currentIndex$: Observable<number> = this.currentIndexSubject.asObservable();

  constructor() {
    // Listen for keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Record an operation for undo/redo
   */
  recordOperation(
    type: UndoRedoOperation['type'],
    description: string,
    beforeState: ShipData,
    afterState: ShipData,
    itemId?: string,
    itemName?: string
  ): void {
    // Remove any "redo" operations after current index
    if (this.currentIndex < this.operationStack.length - 1) {
      this.operationStack = this.operationStack.slice(0, this.currentIndex + 1);
    }

    // Create new operation
    const operation: UndoRedoOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      description,
      before: JSON.parse(JSON.stringify(beforeState)),
      after: JSON.parse(JSON.stringify(afterState)),
      itemId,
      itemName
    };

    // Add to stack
    this.operationStack.push(operation);
    this.currentIndex++;

    // Maintain max stack size
    if (this.operationStack.length > this.maxStackSize) {
      this.operationStack.shift();
      this.currentIndex--;
    }

    this.updateSubjects();
  }

  /**
   * Get current state (after current operation)
   */
  getCurrentState(): ShipData | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.operationStack.length) {
      return JSON.parse(JSON.stringify(this.operationStack[this.currentIndex].after));
    }
    return null;
  }

  /**
   * Undo to previous state
   */
  undo(): UndoRedoOperation | null {
    if (this.canUndo()) {
      const operation = this.operationStack[this.currentIndex];
      this.currentIndex--;
      this.updateSubjects();
      return operation;
    }
    return null;
  }

  /**
   * Redo to next state
   */
  redo(): UndoRedoOperation | null {
    if (this.canRedo()) {
      this.currentIndex++;
      const operation = this.operationStack[this.currentIndex];
      this.updateSubjects();
      return operation;
    }
    return null;
  }

  /**
   * Jump to specific operation in history
   */
  jumpToOperation(index: number): UndoRedoOperation | null {
    if (index >= 0 && index < this.operationStack.length) {
      this.currentIndex = index;
      this.updateSubjects();
      return this.operationStack[index];
    }
    return null;
  }

  /**
   * Get state at specific point in history
   */
  getStateAtIndex(index: number): ShipData | null {
    if (index >= 0 && index < this.operationStack.length) {
      return JSON.parse(JSON.stringify(this.operationStack[index].after));
    }
    return null;
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.currentIndex < this.operationStack.length - 1;
  }

  /**
   * Get full operation history
   */
  getHistory(): UndoRedoOperation[] {
    return JSON.parse(JSON.stringify(this.operationStack));
  }

  /**
   * Get history visibility (which operations are in past/current/future)
   */
  getHistoryVisibility(): { past: number; current: number; future: number } {
    return {
      past: this.currentIndex,
      current: this.currentIndex >= 0 && this.currentIndex < this.operationStack.length ? 1 : 0,
      future: this.operationStack.length - this.currentIndex - 1
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.operationStack = [];
    this.currentIndex = -1;
    this.updateSubjects();
  }

  /**
   * Setup keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y for redo)
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Check if we're not in an input field
      if ((event.target as HTMLElement).tagName === 'INPUT') {
        return;
      }

      // Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      }

      // Ctrl+Y (Windows/Linux) or Cmd+Y (Mac) or Ctrl+Shift+Z
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        this.redo();
      }
    });
  }

  /**
   * Update all subscribers
   */
  private updateSubjects(): void {
    this.operationStackSubject.next(JSON.parse(JSON.stringify(this.operationStack)));
    this.currentIndexSubject.next(this.currentIndex);
  }
}
