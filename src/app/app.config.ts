// src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

// 🚨 REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: 'AIzaSyC5tdlJxwcSqbHwGAjOjUbd7XVU54ePawk',
  authDomain: 'mountain-sentinel.firebaseapp.com',
  projectId: 'mountain-sentinel',
  storageBucket: 'mountain-sentinel.firebasestorage.app',
  messagingSenderId: '635510430186',
  appId: '1:635510430186:web:e333c2a926d64d44383a93',
  measurementId: 'G-5G9M3TM3NW',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideRouter(APP_ROUTES),
  ],
};
