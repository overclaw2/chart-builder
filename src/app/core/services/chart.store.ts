import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  asapScheduler,
  scheduled,
} from 'rxjs';
import {
  Chart,
  ChartCreateInput,
  ChartUpdateInput,
  DragDropEvent,
} from '../models/chart.model';

@Injectable({
  providedIn: 'root',
})
export class ChartStore {
  private charts$ = new BehaviorSubject<Chart[]>([]);
  private selectedChartId$ = new BehaviorSubject<string | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  // Public observables
  charts = this.charts$.asObservable();
  selectedChartId = this.selectedChartId$.asObservable();
  loading = this.loading$.asObservable();
  error = this.error$.asObservable();

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize with sample data (development only)
   */
  private initializeSampleData(): void {
    const sampleCharts: Chart[] = [
      {
        id: 'chart-1',
        title: 'Sales Chart',
        type: 'bar',
        config: {
          colors: ['#3b82f6', '#10b981'],
          legend: true,
          tooltip: true,
        },
        data: [
          { id: 'item-1', name: 'Product A', value: 120 },
          { id: 'item-2', name: 'Product B', value: 95 },
          { id: 'item-3', name: 'Product C', value: 150 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.charts$.next(sampleCharts);
    if (sampleCharts.length > 0) {
      this.selectedChartId$.next(sampleCharts[0].id);
    }
  }

  /**
   * Get all charts
   */
  getCharts(): Chart[] {
    return this.charts$.value;
  }

  /**
   * Get chart by ID
   */
  getChartById(id: string): Chart | undefined {
    return this.charts$.value.find((chart) => chart.id === id);
  }

  /**
   * Create new chart
   */
  createChart(input: ChartCreateInput): Chart {
    const chart: Chart = {
      id: this.generateId('chart'),
      title: input.title,
      type: input.type,
      config: input.config || {},
      data: input.data || [],
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [...this.charts$.value, chart];
    this.charts$.next(updated);
    this.selectedChartId$.next(chart.id);
    return chart;
  }

  /**
   * Update chart
   */
  updateChart(id: string, input: ChartUpdateInput): void {
    const charts = this.charts$.value.map((chart) => {
      if (chart.id === id) {
        return {
          ...chart,
          ...input,
          updatedAt: new Date(),
        };
      }
      return chart;
    });
    this.charts$.next(charts);
  }

  /**
   * Delete chart
   */
  deleteChart(id: string): void {
    const charts = this.charts$.value.filter((chart) => chart.id !== id);
    this.charts$.next(charts);

    // If deleted chart was selected, select first remaining
    if (this.selectedChartId$.value === id) {
      this.selectedChartId$.next(charts.length > 0 ? charts[0].id : null);
    }
  }

  /**
   * Set selected chart
   */
  selectChart(id: string): void {
    if (this.charts$.value.find((chart) => chart.id === id)) {
      this.selectedChartId$.next(id);
    }
  }

  /**
   * Move data item between charts
   */
  moveItemBetweenCharts(
    itemId: string,
    fromChartId: string,
    toChartId: string
  ): void {
    const charts = this.charts$.value.map((chart) => {
      // Remove from source chart
      if (chart.id === fromChartId) {
        return {
          ...chart,
          data: chart.data.filter((item) => item.id !== itemId),
          updatedAt: new Date(),
        };
      }

      // Add to target chart
      if (chart.id === toChartId) {
        const itemToMove = this.charts$.value
          .find((c) => c.id === fromChartId)
          ?.data.find((d) => d.id === itemId);

        if (itemToMove) {
          return {
            ...chart,
            data: [...chart.data, itemToMove],
            updatedAt: new Date(),
          };
        }
      }

      return chart;
    });

    this.charts$.next(charts);
  }

  /**
   * Add data item to chart
   */
  addItemToChart(chartId: string, item: Omit<DataItem, 'id'>): void {
    const charts = this.charts$.value.map((chart) => {
      if (chart.id === chartId) {
        const newItem: DataItem = { ...item as any, id: this.generateId('item') };
        return {
          ...chart,
          data: [...chart.data, newItem],
          updatedAt: new Date(),
        };
      }
      return chart;
    });
    this.charts$.next(charts);
  }

  /**
   * Remove data item from chart
   */
  removeItemFromChart(chartId: string, itemId: string): void {
    const charts = this.charts$.value.map((chart) => {
      if (chart.id === chartId) {
        return {
          ...chart,
          data: chart.data.filter((item) => item.id !== itemId),
          updatedAt: new Date(),
        };
      }
      return chart;
    });
    this.charts$.next(charts);
  }

  /**
   * Clear all charts (reset)
   */
  clear(): void {
    this.charts$.next([]);
    this.selectedChartId$.next(null);
    this.error$.next(null);
  }

  /**
   * Utility: generate unique IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
