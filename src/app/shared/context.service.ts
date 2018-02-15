import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { RigProfile } from 'app/shared/schema';

@Injectable()
export class ContextService {
  private readonly selectedRigProfile: BehaviorSubject<RigProfile | null> =
    new BehaviorSubject<RigProfile | null>(null);
  private readonly selectedFilter: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  public updateRigProfile(update: RigProfile | null): void {
    this.selectedRigProfile.next(update);
  }

  public getRigProfile(): Observable<RigProfile> {
    return this.selectedRigProfile
      .asObservable()
      .filter((v): v is RigProfile => v != null);
  }

  public updateFilter(update: string | null): void {
    this.selectedFilter.next(update);
  }

  public getFilter(): Observable<string | null> {
    return this.selectedFilter.asObservable();
  }
}
