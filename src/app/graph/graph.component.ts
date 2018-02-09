import { Component, Input, OnInit } from '@angular/core';
import { TimeseriesData } from 'app/shared/timeseries.interface';

@Component({
  selector: 'msu-graph',
  styleUrls: ['./graph.component.scss'],
  templateUrl: './graph.component.html',
})
export class GraphComponent {
  @Input() public data?: TimeseriesData;

  public constructor() {
    // Nothing to do.
  }
}
