import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatSpinner,
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

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { GraphComponent } from './graph/graph.component';
import { PoolProfitabilityComponent } from './pool-profitability/pool-profitability.component';
import { MetricsService } from './shared/metrics.service';

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
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTableModule,
    NgxChartsModule,
  ],
  providers: [
    MetricsService,
  ],
})
export class AppModule { }
