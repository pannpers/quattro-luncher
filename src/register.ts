import { Container } from 'aurelia-framework'

import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import * as firebaseui from 'firebaseui'
import { AuthUiService } from 'services/firebase/auth-ui'
import { AuthService } from 'services/firebase/auth'
import { FirestoreService } from 'services/firebase/firestore'
import * as environment from '../config/environment.json'

export const registerDependencies = (c: Container): void => {
  const firebaseApp = firebase.initializeApp(environment.firebaseConfig)
  const auth = firebaseApp.auth()
  const ui = new firebaseui.auth.AuthUI(auth)

  c.registerInstance(AuthService, new AuthService(auth))
  c.registerInstance(AuthUiService, new AuthUiService(ui))

  c.registerInstance(FirestoreService, new FirestoreService(firebaseApp.firestore()))
}
