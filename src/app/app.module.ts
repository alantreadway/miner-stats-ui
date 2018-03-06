import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
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
import { ContextService } from 'app/shared/context.service';
import { MediaQueryService } from 'app/shared/media-query.service';
import { WalletsService } from 'app/shared/wallets.service';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ContextComponent } from './context/context.component';
import { GraphComponent } from './graph/graph.component';
import { CurrentComponent } from './pool-profitability/current/current.component';
import { HistoryComponent } from './pool-profitability/history/history.component';
import { PoolProfitabilityComponent } from './pool-profitability/pool-profitability.component';
import { RigProfileEditorComponent } from './rig-profile-editor/rig-profile-editor.component';
import { DigitalCurrencyPipe } from './shared/digital-currency.pipe';
import { DimensionsDirective } from './shared/dimensions.directive';
import { MetricsService } from './shared/metrics.service';
import { RigProfilesService } from './shared/rig-profiles.service';
import { WalletComponent } from './wallet/wallet.component';

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
    HistoryComponent,
    CurrentComponent,
    DimensionsDirective,
    ContextComponent,
    RigProfileEditorComponent,
    WalletComponent,
    DigitalCurrencyPipe,
  ],
  entryComponents: [
    RigProfileEditorComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(APP_ROUTES),
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    FlexLayoutModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
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
    ContextService,
    MediaQueryService,
    MetricsService,
    RigProfilesService,
    WalletsService,
  ],
})
export class AppModule { }
