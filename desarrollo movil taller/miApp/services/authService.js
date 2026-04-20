import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export const authService = {
  register: (email, password) => createUserWithEmailAndPassword(auth, email, password),

  login: (email, password) => signInWithEmailAndPassword(auth, email, password),

  logout: () => signOut(auth),

  subscribeToAuthState: (callback) => onAuthStateChanged(auth, callback),

  getCurrentUser: () => auth.currentUser,
};
