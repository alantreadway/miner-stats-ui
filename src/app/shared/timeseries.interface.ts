export interface TimeseriesData {
  name: string;
  series: {
    value: number;
    min?: number;
    max?: number;
    name: Date;
  }[];
}
