import { autoinject } from 'aurelia-framework'
import { AuthService } from 'services/firebase/auth'
import { NavigationInstruction, Next, Redirect, NextCompletionResult } from 'aurelia-router'
import { getLogger } from 'aurelia-logging'
import { RouteConfigs } from 'app'

@autoinject
export class AuthorizeStep {
  private readonly logger = getLogger(AuthorizeStep.name)

  constructor(private auth: AuthService) {}

  run(instruction: NavigationInstruction, next: Next): Promise<void | NextCompletionResult<any>> {
    this.logger.debug(`incomming route ${instruction.fragment}, user sined in: ${this.auth.isSignedIn}`)

    if (!this.auth.isSignedIn && instruction.fragment !== `/${RouteConfigs.signIn.route}`) {
      return next.cancel(new Redirect(RouteConfigs.signIn.route))
    }

    // http://davismj.me/blog/dynamic-routing/
    const adminRequired = instruction.config.settings.admin
    if (!adminRequired) {
      return next()
    }

    if (this.auth.isAdmin) {
      return next()
    }
    this.logger.warn(`missing required permissions`)
    return next.cancel(new Redirect(RouteConfigs.top.route))
  }
}
