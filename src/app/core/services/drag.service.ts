import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DataItem } from '../models/chart.model';

export interface DragStartEvent {
  itemId: string;
  chartId: string;
  item: DataItem;
}

export interface DropEvent {
  itemId: string;
  fromChartId: string;
  toChartId: string;
  item: DataItem;
}

@Injectable({
  providedIn: 'root',
})
export class DragService {
  private dragStart$ = new Subject<DragStartEvent>();
  private drop$ = new Subject<DropEvent>();
  private dragOver$ = new Subject<{ chartId: string }>();

  // Current drag context (what's being dragged)
  private currentDragContext: DragStartEvent | null = null;

  dragStart = this.dragStart$.asObservable();
  drop = this.drop$.asObservable();
  dragOver = this.dragOver$.asObservable();

  /**
   * Initiate drag
   */
  startDrag(event: DragStartEvent): void {
    this.currentDragContext = event;
    this.dragStart$.next(event);
  }

  /**
   * Emit drag over event
   */
  emitDragOver(chartId: string): void {
    this.dragOver$.next({ chartId });
  }

  /**
   * Complete drop operation
   */
  completeDrop(toChartId: string): void {
    if (!this.currentDragContext) {
      console.warn('Drop attempted without active drag context');
      return;
    }

    // Validate: same chart = no-op
    if (this.currentDragContext.chartId === toChartId) {
      this.endDrag();
      return;
    }

    const event: DropEvent = {
      itemId: this.currentDragContext.itemId,
      fromChartId: this.currentDragContext.chartId,
      toChartId,
      item: this.currentDragContext.item,
    };

    this.drop$.next(event);
    this.endDrag();
  }

  /**
   * Cancel drag
   */
  cancelDrag(): void {
    this.endDrag();
  }

  /**
   * Get current drag context
   */
  getCurrentDragContext(): DragStartEvent | null {
    return this.currentDragContext;
  }

  /**
   * End drag (cleanup)
   */
  private endDrag(): void {
    this.currentDragContext = null;
  }
}
