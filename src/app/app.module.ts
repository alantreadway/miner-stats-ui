import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatGridListModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import { MediaQueryService } from 'app/shared/media-query.service';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { GraphComponent } from './graph/graph.component';
import { PoolProfitabilityComponent } from './pool-profitability/pool-profitability.component';
import { MetricsService } from './shared/metrics.service';
import { RigProfilesService } from './shared/rig-profiles.service';

const APP_ROUTES: Routes = [
  { path: 'pool-profitability', component: PoolProfitabilityComponent },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/pool-profitability',
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: '/pool-profitability',
  },
];

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    GraphComponent,
    PoolProfitabilityComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(APP_ROUTES),
    ReactiveFormsModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    FlexLayoutModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatGridListModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTableModule,
    NgxChartsModule,
  ],
  providers: [
    AngularFire2DatabaseAdaptor,
    MediaQueryService,
    MetricsService,
    RigProfilesService,
  ],
})
export class AppModule { }
