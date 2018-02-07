import { Component, Input, OnInit } from '@angular/core';

export interface TimeseriesData {
  name: string;
  series: {
    value: number;
    min?: number;
    max?: number;
    name: string | Date;
  }[];
}

@Component({
  selector: 'msu-graph',
  styleUrls: ['./graph.component.css'],
  templateUrl: './graph.component.html',
})
export class GraphComponent {
  @Input() public data: TimeseriesData;

  public constructor() {
    // Nothing to do.
  }
}
