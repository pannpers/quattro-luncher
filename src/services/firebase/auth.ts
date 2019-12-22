import { autoinject } from 'aurelia-framework'
import { Router } from 'aurelia-router'
import { getLogger } from 'aurelia-logging'
import { RouteConfigs } from 'app'

// https://firebase.google.com/docs/auth/admin/custom-claims
interface CustomUesrClaims {
  admin: boolean
}

@autoinject
export class AuthService {
  private readonly logger = getLogger(AuthService.name)

  static allowedAuthDomain = 'zeals.co.jp'

  isSignedIn = false
  isAdmin = false

  constructor(public auth: firebase.auth.Auth) {}

  async updateUserState(user: firebase.User) {
    if (user === null) {
      this.isSignedIn = false
      this.isAdmin = false
      this.logger.info('user signed out')
      return
    }

    if (!this.validate(user)) {
      this.isSignedIn = true
      this.isAdmin = false
      this.logger.warn(`signed out because ${user.email.split('@')[1]} is not allowed domain`)
      return
    }

    this.isSignedIn = true
    this.logger.info('user signed in')

    // https://firebase.google.com/docs/auth/admin/custom-claims#access_custom_claims_on_the_client
    const idTokenResult = await user.getIdTokenResult()
    const claims = idTokenResult.claims as CustomUesrClaims
    this.isAdmin = claims.admin
  }

  signOut(): void {
    this.auth.signOut()
  }

  private validate(user: firebase.User): boolean {
    return user && user.email.endsWith(AuthService.allowedAuthDomain)
  }

}
