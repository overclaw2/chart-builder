import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Chart } from '../../core/models/chart.model';
import { ChartStore } from '../../core/services/chart.store';
import { ChartWrapperComponent } from '../../shared/components/chart-wrapper/chart-wrapper.component';

@Component({
  selector: 'app-chart-canvas',
  standalone: true,
  imports: [CommonModule, ChartWrapperComponent],
  templateUrl: './chart-canvas.component.html',
  styleUrls: ['./chart-canvas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCanvasComponent implements OnInit {
  charts$: Observable<Chart[]>;
  selectedChartId$: Observable<string | null>;

  constructor(private chartStore: ChartStore) {
    this.charts$ = this.chartStore.charts;
    this.selectedChartId$ = this.chartStore.selectedChartId;
  }

  ngOnInit(): void {
    // Initialize if needed
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
