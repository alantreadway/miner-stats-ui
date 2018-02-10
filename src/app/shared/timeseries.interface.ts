export interface TimeseriesDataPoint {
  value: number;
  min?: number;
  max?: number;
  name: Date;
}

export interface TimeseriesData {
  name: string;
  series: TimeseriesDataPoint[];
}
