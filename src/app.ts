/* eslint-disable no-param-reassign */
/* eslint-disable prettier/prettier */
import { autoinject, PLATFORM } from 'aurelia-framework'
import { AuthService } from 'services/firebase/auth'
import { RouterConfiguration, Router, RouteConfig } from 'aurelia-router'
import { AuthorizeStep } from 'authorize-step'

export const RouteConfigs = {
  admin: { route: 'admin', name: 'admin', moduleId: PLATFORM.moduleName('routes/admin'), title: 'Administrator', settings: { admin: true } },
  signIn: { route: 'sign-in', name: 'sign-in', moduleId: PLATFORM.moduleName('routes/sign-in'), title: 'Sign In' },
  top: { route: '', name: 'top', moduleId: PLATFORM.moduleName('routes/top'), title: 'Top Page' },
  newParty: { route: 'parties/new', name: 'new-party', moduleId: PLATFORM.moduleName('routes/new-party'), title: 'New Lunch Party' },
  upload: { route: 'upload', name: 'upload', moduleId: PLATFORM.moduleName('routes/upload'), title: 'Upload Photos' },
}

@autoinject
export class App {
  router: Router

  constructor(private auth: AuthService) {}

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = 'Aurelia Scaffold App'

    config.options.pushState = true
    config.options.root = '/'

    config.addAuthorizeStep(AuthorizeStep)

    config.map(Object.values(RouteConfigs))

    this.router = router
  }
}
