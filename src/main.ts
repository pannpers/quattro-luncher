import { Aurelia, PLATFORM } from 'aurelia-framework'
import { Router } from 'aurelia-router'
import { registerDependencies } from 'register'
import { AuthService } from 'services/firebase/auth'
import * as environment from '../config/environment.json'

export function configure(aurelia: Aurelia): void {
  aurelia.use.standardConfiguration().feature(PLATFORM.moduleName('resources/index'))

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn')

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'))
  }

  registerDependencies(aurelia.container)

  aurelia.start().then((): void => {
    const auth = aurelia.container.get(AuthService) as AuthService
    const router = aurelia.container.get(Router) as Router

    auth.auth.onAuthStateChanged(
      async (user): Promise<void> => {
        if (!router.isConfigured) {
          aurelia.setRoot(PLATFORM.moduleName('app'))
        }

        if (user === null) {
          auth.isSignedIn = false
        } else {
          if (auth.validate(user)) {
            auth.isSignedIn = true
            auth.logger.info(`${user} is signed in`)
          } else {
            // TODO: use popup dialog
            auth.logger.warn(`sign out because ${user.email.split('@')[1]} is not allowed domain`)
            auth.signOut()
          }
        }
      },
    )
  })
}
