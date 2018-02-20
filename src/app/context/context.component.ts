import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { MatDialog, MatSelectChange } from '@angular/material';
import { ContextService } from 'app/shared/context.service';
import { RigProfilesService } from 'app/shared/rig-profiles.service';
import { ALL_ALGORITHMS, ALL_POOLS, RigProfile } from 'app/shared/schema';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import {
  RigProfileEditorComponent,
  RigProfileEditorParameters,
} from '../rig-profile-editor/rig-profile-editor.component';

const SORTED_FILTER_NAMES = [
  ...ALL_ALGORITHMS,
  ...ALL_POOLS,
  ..._.flatten(ALL_POOLS.map(p => ALL_ALGORITHMS.map(a => `${p} - ${a}`))),
]
  .sort();

@Component({
  selector: 'msu-context',
  styleUrls: ['./context.component.scss'],
  templateUrl: './context.component.html',
})
export class ContextComponent implements OnDestroy {
  public readonly filterForm: FormGroup;
  public readonly filterNameOptions: Observable<string[]>;

  public readonly rigProfilesAvailable: Observable<{ [uuid: string]: RigProfile }>;
  public readonly rigProfileUuid: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  public readonly keys: typeof Object.keys = Object.keys;

  public readonly subscriptions: Subscription[] = [];

  public constructor(
    private readonly rigProfiles: RigProfilesService,
    private readonly context: ContextService,
    private readonly rigProfileEditorDialog: MatDialog,
  ) {
    this.rigProfilesAvailable = this.rigProfiles.getRigProfiles();
    this.rigProfiles.getDefaultRigProfile()
      .first()
      .subscribe((defaultProfile) => {
        if (defaultProfile != null) {
          this.rigProfileUuid.next(defaultProfile);
        }
      });
    this.subscriptions.push(
      this.rigProfilesAvailable
        .combineLatest(
          this.rigProfileUuid.filter((v): v is string => v != null),
        )
        .map(([profiles, selected]) => profiles[selected])
        .subscribe((profile) => this.context.updateRigProfile(profile)),
    );

    this.filterForm = new FormGroup({
      name: new FormControl(''),
    });
    this.subscriptions.push(
      this.filterForm.valueChanges
        .startWith({ name: '' })
        .map((form) => form.name ? form.name : null)
        .subscribe((filter) => this.context.updateFilter(filter)),
    );

    this.filterNameOptions = Observable.of(SORTED_FILTER_NAMES)
      .combineLatest(this.filterForm.valueChanges.startWith({}))
      .map(([names, form]) => {
        return form.name ?
          names.filter(n => n.indexOf(form.name) >= 0) :
          names;
      });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public rigProfileSelected(event: MatSelectChange): void {
    this.rigProfileUuid.next(event.value);
  }

  public clearFilter(event: Event): void {
    event.stopPropagation();

    this.filterForm.setValue({ name: '' });
  }

  public editRigProfile(event: Event): void {
    event.stopPropagation();

    this.rigProfilesAvailable
      .combineLatest(this.rigProfileUuid)
      .map(([profiles, uuid]) => [ uuid && profiles[uuid] || {}, uuid ])
      .first()
      .subscribe(([profile, uuid]) => {
        this.rigProfileEditorDialog.open(
          RigProfileEditorComponent,
          {
            data: {
              rigProfile: profile,
              uuid,
            } as RigProfileEditorParameters,
          },
        );
      });
  }
}
