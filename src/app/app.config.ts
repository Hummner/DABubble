import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"dabubble-5e60a","appId":"1:923930570471:web:9103cca1b6719307317c42","storageBucket":"dabubble-5e60a.firebasestorage.app","apiKey":"AIzaSyBPmxmhpsaMXTPZYqAq8LyBkf5GT8g_Q8I","authDomain":"dabubble-5e60a.firebaseapp.com","messagingSenderId":"923930570471"})), provideFirestore(() => getFirestore()), provideAnimationsAsync()]
};
