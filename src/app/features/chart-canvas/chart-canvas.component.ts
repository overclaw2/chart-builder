import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Chart } from '../../core/models/chart.model';
import { ChartStore } from '../../core/services/chart.store';
import { DarkModeService } from '../../core/services/dark-mode.service';

@Component({
  selector: 'app-root',
  templateUrl: './chart-canvas.component.html',
  styleUrls: ['./chart-canvas.component.css'],
})
export class ChartCanvasComponent implements OnInit {
  charts$: Observable<Chart[]>;
  selectedChartId$: Observable<string | null>;

  constructor(
    private chartStore: ChartStore,
    private darkModeService: DarkModeService
  ) {
    this.charts$ = this.chartStore.charts;
    this.selectedChartId$ = this.chartStore.selectedChartId;
  }

  ngOnInit(): void {
    // Dark mode service is automatically initialized
    // Theme preference is loaded from localStorage on service instantiation
  }

  onChartSelect(chartId: string): void {
    this.chartStore.selectChart(chartId);
  }

  onAddChart(): void {
    this.chartStore.createChart({
      title: `New Chart ${Date.now()}`,
      type: 'bar',
      config: {
        colors: ['#3b82f6', '#10b981'],
        legend: true,
        tooltip: true,
      },
      data: [
        { id: `item-${Date.now()}`, name: 'Sample', value: 100 },
      ],
    });
  }

  onDeleteChart(chartId: string): void {
    if (confirm('Delete this chart?')) {
      this.chartStore.deleteChart(chartId);
    }
  }
}
