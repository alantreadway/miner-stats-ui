import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { TimeseriesData } from 'app/shared/timeseries.interface';

@Component({
  selector: 'msu-graph',
  styleUrls: ['./graph.component.scss'],
  templateUrl: './graph.component.html',
})
export class GraphComponent implements OnChanges {
  @Input() public data?: TimeseriesData[];
  @Input() public size?: [number, number];
  @Input() public showAxis?: [boolean, boolean];
  @Input() public showLabel?: [boolean, boolean];

  public displayData: TimeseriesData[] = [];

  public constructor() {
    // Nothing to do.
  }

  public ngOnChanges(): void {
    this.displayData = [...(this.data || [])];
  }
}
