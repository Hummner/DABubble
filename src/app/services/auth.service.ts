import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  signInAnonymously,
} from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { signOut } from 'firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);

  register(name: string, email: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((response) => updateProfile(response.user, { displayName: name }));
    return from(promise);
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then(() => {
      console.log(this.firebaseAuth.currentUser);
    });
    return from(promise);
  }

  signInAnonymously(): Observable<void> {
    const promise = signInAnonymously(this.firebaseAuth)
      .then(() => {})
      .catch((err) => {
        const errorCode = err.code;
        const errorMessage = err.message;
        console.error(`Error ${errorCode}: ${errorMessage}`);
        throw err;
      });
    return from(promise);
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth);
    return from(promise);
  }

  sendPasswordResetEmail(
    auth: Auth,
    email: string,
    redirectUrl: string
  ): Observable<void> {
    const actionCodeSettings = {
      url: redirectUrl,
      handleCodeInApp: true,
    };
    const promise = sendPasswordResetEmail(
      auth,
      email,
      actionCodeSettings
    ).then(() => {
      console.log('Password reset sent');
    });
    return from(promise);
  }
}
