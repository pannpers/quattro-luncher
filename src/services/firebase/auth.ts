import { autoinject } from 'aurelia-framework'
import { Router } from 'aurelia-router'
import { getLogger } from 'aurelia-logging'
import { RouteConfigs } from 'app'

@autoinject
export class AuthService {
  public readonly logger = getLogger(AuthService.name)

  public static allowedAuthDomain = 'zeals.co.jp'

  public isSignedIn = false

  constructor(public auth: firebase.auth.Auth) {}

  public validate(user: firebase.User): boolean {
    return user && user.email.endsWith(AuthService.allowedAuthDomain)
  }

  public signOut(): void {
    this.auth.signOut()
  }
}
