import { autoinject } from 'aurelia-framework'
import * as firebase from 'firebase/app'
import 'firebase/auth'
import { AuthService } from './auth'

enum SignInFlow {
  POPUP = 'popup',
  REDIRECT = 'redirect',
}

@autoinject
export class AuthUiService {
  // https://github.com/firebase/firebaseui-web#configuration
  private readonly config: firebaseui.auth.Config = {
    callbacks: {
      signInSuccessWithAuthResult: (): boolean => {
        return true
      },
    },
    signInFlow: SignInFlow.POPUP,
    signInSuccessUrl: '/',
    signInOptions: [
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // You MUST validate a G Suite hosted domain if the security rules and your server side.
        // For more details about Google OAuth 2.0 specification, see the below.
        // https://developers.google.com/identity/protocols/OpenIDConnect#validatinganidtoken
        // And you can see below how to validate it in the incomming request to Firestore.
        // https://firebase.google.com/docs/firestore/security/rules-conditions
        customParameters: {
          hd: AuthService.allowedAuthDomain,
        }
      }
    ],
  }

  constructor(private ui: firebaseui.auth.AuthUI) {}

  public render(elementId: string): void {
    this.ui.start(elementId, this.config)
  }
}
