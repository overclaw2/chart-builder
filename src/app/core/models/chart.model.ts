/**
 * Core chart data models
 */

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

export interface DataItem {
  id: string;
  name: string;
  value: number | string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  colors?: string[];
  legend?: boolean;
  tooltip?: boolean;
  grid?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  // Extensible for ECharts-specific options
  [key: string]: any;
}

export interface Chart {
  id: string;
  title: string;
  type: ChartType;
  config: ChartConfig;
  data: DataItem[];
  position?: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartCreateInput {
  title: string;
  type: ChartType;
  config?: Partial<ChartConfig>;
  data?: DataItem[];
}

export interface ChartUpdateInput {
  title?: string;
  type?: ChartType;
  config?: Partial<ChartConfig>;
  data?: DataItem[];
  position?: { x: number; y: number };
}

export interface DragDropEvent {
  itemId: string;
  fromChartId: string;
  toChartId: string;
  item: DataItem;
}
