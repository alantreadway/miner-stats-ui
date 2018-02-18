import { Component, Input, OnChanges } from '@angular/core';
import { TimeseriesData } from 'app/shared/timeseries.interface';

@Component({
  selector: 'msu-graph',
  styleUrls: ['./graph.component.scss'],
  templateUrl: './graph.component.html',
})
export class GraphComponent implements OnChanges {
  @Input() public size: [number, number];
  @Input() public highlight?: TimeseriesData[];
  @Input() public data?: TimeseriesData[];
  @Input() public showAxis?: [boolean, boolean];
  @Input() public showLabel?: [boolean, boolean];

  public displayData: TimeseriesData[] = [];
  public highlightData: TimeseriesData[] = [];

  public ngOnChanges(): void {
    this.displayData = this.data || [];
    this.highlightData = this.highlight || [];
  }
}
