// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // 👈 Import config
import { App } from './app/app'; // 👈 Import the root component

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
