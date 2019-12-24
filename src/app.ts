/* eslint-disable no-param-reassign */
/* eslint-disable prettier/prettier */
import { autoinject, PLATFORM } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { AuthService } from 'services/firebase/auth'
import { RouterConfiguration, Router } from 'aurelia-router'
import { AuthorizeStep } from 'authorize-step'

export const RouteConfigs = {
  admin: {
    route: 'admin',
    name: 'admin',
    moduleId: PLATFORM.moduleName('routes/admin'),
    title: 'Admin',
    nav: 4,
    settings: {
      icon: 'settings_applications',
      admin: true,
    }
  },
  signIn: {
    route: 'sign-in',
    name: 'sign-in',
    moduleId: PLATFORM.moduleName('routes/sign-in'),
    title: 'Sign In'
  },
  top: {
    route: '',
    name: 'top',
    moduleId: PLATFORM.moduleName('routes/top'),
    title: 'Home',
    nav: 1,
    settings: {
      icon: 'home',
    }
  },
  newParty: {
    route: 'parties/new',
    name: 'new-party',
    moduleId: PLATFORM.moduleName('routes/new-party'),
    title: 'New Lunch Party',
  },
  history: {
    route: 'history',
    name: 'history',
    moduleId: PLATFORM.moduleName('routes/history'),
    title: 'History',
    nav: 3,
    settings: {
      icon: 'history',
    },
  },
  upload: {
    route: 'upload',
    name: 'upload',
    moduleId: PLATFORM.moduleName('routes/upload'),
    title: 'Photo',
    nav: 2,
    settings: {
      icon: 'add_a_photo',
    },
  },
}

@autoinject
export class App {
  private readonly logger = getLogger(App.name)

  router: Router

  constructor(private auth: AuthService) {
    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker.register('sw.js')
    //     .then(registration => this.logger.info('ServiceWorker is registered', registration))
    //     .catch(err => this.logger.error(`ServiceWorker failed to register:`, err))
    // }
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = 'Aurelia Scaffold App'

    config.options.pushState = true
    config.options.root = '/'

    config.addAuthorizeStep(AuthorizeStep)

    config.map(Object.values(RouteConfigs))

    this.router = router
  }
}
