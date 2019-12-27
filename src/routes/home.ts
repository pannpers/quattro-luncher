import { RouteConfigs } from 'app'
import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { Redirect, Router } from 'aurelia-router'
import { Lunch } from 'models/lunch'
import { SlackUser } from 'models/slack-user'
import { AuthService } from 'services/firebase/auth'
import { FirestoreService } from 'services/firebase/firestore'

@autoinject
export class Top {
  private readonly logger = getLogger(Top.name)

  lunch: Lunch | null = null
  slackUsers: SlackUser[] = []

  constructor(private router: Router, private auth: AuthService, private store: FirestoreService) {}

  async canActivate(): Promise<boolean | Redirect> {
    this.lunch = await this.store.getLatestLunch()
    this.logger.debug('fetched next lunch:', this.lunch)

    if (!this.lunch.hasFixedParties) {
      this.logger.info(`redirect to ${RouteConfigs.newParty.name} page`)
      return new Redirect(RouteConfigs.newParty.route)
    }

    return true
  }

  signOut(): void {
    this.auth.signOut()
    this.router.navigateToRoute('sign-in')
  }
}
