import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as uuid from 'uuid';

import { FormControl, FormGroup } from '@angular/forms';
import { RigProfilesService } from 'app/shared/rig-profiles.service';
import { Algorithm, ALL_ALGORITHMS, RigProfile } from 'app/shared/schema';
import { Dictionary } from 'lodash';
import { MetricsService } from '../shared/metrics.service';

export interface RigProfileEditorParameters {
  rigProfile: RigProfile;
  uuid?: string;
}

@Component({
  selector: 'msu-rig-profile-editor',
  styleUrls: ['./rig-profile-editor.component.scss'],
  templateUrl: './rig-profile-editor.component.html',
})
export class RigProfileEditorComponent {
  public readonly form: FormGroup;

  public readonly ALL_ALGORITHMS: typeof ALL_ALGORITHMS = ALL_ALGORITHMS;
  public readonly scales: {[key in Algorithm]: number};

  public constructor(
    private readonly rigProfileService: RigProfilesService,
    private readonly metricsService: MetricsService,
    private readonly dialogRef: MatDialogRef<RigProfileEditorComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: RigProfileEditorParameters,
  ) {
    this.scales = {
      ...ALL_ALGORITHMS.reduce(
        (result, next) => {
          result[next] = this.metricsService.getBaseUnitsFor(next);
          return result;
        },
        {} as { [ key in Algorithm]?: number },
      ),
    } as {[key in Algorithm]: number};

    this.form = new FormGroup({
      ...ALL_ALGORITHMS.reduce(
        (controls, next) => {
          const value = this.data.rigProfile.hashrates[next];
          if (value != null) {
            controls[next] = new FormControl(value * 1000 / this.scales[next]);
          } else {
            controls[next] = new FormControl();
          }

          return controls;
        },
        {
          name: new FormControl(this.data.rigProfile.name),
        } as Dictionary<FormControl>,
      ),
    });
  }

  public save(event: Event): void {
    event.stopPropagation();

    const formValue = this.form.value;
    const profileUuid = this.data.uuid || uuid.v4();
    const profile = ALL_ALGORITHMS
      .reduce(
        (result, next) => {
          if (formValue[next] != null) {
            result.hashrates[next] = Number(formValue[next]) / 1000 * this.scales[next];
          }
          return result;
        },
        {
          hashrates: {},
          name: formValue.name,
        } as RigProfile,
      );

    this.rigProfileService.saveRigProfile(profileUuid, profile)
      .first()
      .subscribe(() => {
        this.dialogRef.close();
      });
  }

  public cancel(event: Event): void {
    event.stopPropagation();

    this.dialogRef.close();
  }
}
