import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { Map } from './map/map';
import { Report } from './report/report';
import { ReportDetailComponent } from './report-detail/report-detail';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { AdminReport } from './admin-report/admin-report';
import { SafetyFeed } from './safety-feed/safety-feed';
import { UserDashboard } from './user-dashboard/user-dashboard';
import { NotificationComponent } from './notification/notification';
import { Login } from './login/login';
import { adminGuard, authGuard } from './auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', component: DashboardComponent, title: 'Mountain Sentinel Home' },
  { path: 'map', component: Map, title: 'Safety Alert Map' },
  { path: 'login', component: Login, title: 'Login / Sign Up' },
  { path: 'report', component: Report, title: 'Submit Safety Alert', canActivate: [authGuard] },
  { path: 'report-detail/:id', component: ReportDetailComponent, title: 'Alert Details' },
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    title: 'Admin Dashboard',
    canActivate: [adminGuard],
  },
  {
    path: 'admin-report',
    component: AdminReport,
    title: 'Issue Safety Alert',
    canActivate: [adminGuard],
  },
  { path: 'safety-feed', component: SafetyFeed, title: 'Safety Feed' },
  {
    path: 'user-dashboard',
    component: UserDashboard,
    title: 'User Dashboard',
    canActivate: [authGuard],
  },
  { path: 'notification', component: NotificationComponent, title: 'Notifications' },
  { path: '**', redirectTo: '' },
];
