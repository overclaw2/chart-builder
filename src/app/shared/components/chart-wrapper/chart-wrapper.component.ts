import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Chart } from '../../../core/models/chart.model';
import * as echarts from 'echarts';

@Component({
  selector: 'app-chart-wrapper',
  templateUrl: './chart-wrapper.component.html',
  styleUrls: ['./chart-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartWrapperComponent implements OnInit, OnChanges, OnDestroy {
  @Input() chart!: Chart;
  @Input() isSelected: boolean = false;

  @Output() chartClick = new EventEmitter<string>();
  @Output() itemDragStart = new EventEmitter<{ itemId: string; item: any }>();

  @ViewChild('chartContainer', { static: false })
  chartContainer!: ElementRef;

  private chartInstance: echarts.ECharts | null = null;

  ngOnInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chart'] && !changes['chart'].firstChange) {
      this.updateChart();
    }
  }

  private initChart(): void {
    if (!this.chartContainer) {
      setTimeout(() => this.initChart(), 100);
      return;
    }

    const container = this.chartContainer.nativeElement;
    this.chartInstance = echarts.init(container);
    this.updateChart();

    // Listen to chart clicks
    this.chartInstance.on('click', (params: any) => {
      this.chartClick.emit(this.chart.id);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.chartInstance?.resize();
    });
  }

  private updateChart(): void {
    if (!this.chartInstance) return;

    const option = this.buildChartOption();
    this.chartInstance.setOption(option);
  }

  private buildChartOption(): any {
    const { chart } = this;

    switch (chart.type) {
      case 'bar':
        return this.buildBarChart();
      case 'line':
        return this.buildLineChart();
      case 'pie':
        return this.buildPieChart();
      default:
        return this.buildBarChart();
    }
  }

  private buildBarChart(): any {
    const { chart } = this;
    return {
      title: {
        text: chart.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: chart.data.map((d) => d.name),
      },
      xAxis: {
        type: 'category',
        data: chart.data.map((d) => d.name),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: chart.data.map((d) => d.value),
          type: 'bar',
          itemStyle: {
            color: chart.config.colors?.[0] || '#3b82f6',
          },
        },
      ],
      color: chart.config.colors || ['#3b82f6', '#10b981', '#f59e0b'],
    };
  }

  private buildLineChart(): any {
    const { chart } = this;
    return {
      title: {
        text: chart.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: chart.data.map((d) => d.name),
      },
      xAxis: {
        type: 'category',
        data: chart.data.map((d) => d.name),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: chart.data.map((d) => d.value),
          type: 'line',
          smooth: true,
        },
      ],
      color: chart.config.colors || ['#3b82f6', '#10b981', '#f59e0b'],
    };
  }

  private buildPieChart(): any {
    const { chart } = this;
    return {
      title: {
        text: chart.title,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Value',
          type: 'pie',
          radius: '50%',
          data: chart.data.map((d) => ({
            value: d.value,
            name: d.name,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
      color: chart.config.colors || ['#3b82f6', '#10b981', '#f59e0b'],
    };
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  }
}
