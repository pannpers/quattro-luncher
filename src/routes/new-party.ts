import { RouteConfigs } from 'app'
import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { Router, Redirect } from 'aurelia-router'
import { Lunch } from 'models/lunch'
import { Party } from 'models/party'
import { SlackUser } from 'models/slack-user'
import { FirestoreService } from 'services/firebase/firestore'

@autoinject
export class NewParty {
  private readonly logger = getLogger(NewParty.name)

  lunch: Lunch | null = null
  slackUsers: SlackUser[] = []
  tmpParties: Party[] = []

  constructor(private router: Router, private store: FirestoreService) {}

  async canActivate(): Promise<boolean | Redirect> {
    try {
      this.lunch = await this.store.getLatestLunch()
    } catch (err) {
      this.logger.error('failed to latest lunch:', err)
    }
    this.logger.debug('fetched next lunch:', this.lunch)

    if (this.lunch.hasFixedParties) {
      this.logger.info(`redirect to ${RouteConfigs.top.name} page`)
      return new Redirect(RouteConfigs.top.route)
    }

    return true
  }

  async created(): Promise<void> {
    if (!this.lunch.hasFixedParties) {
      try {
        this.slackUsers = await this.store.listActiveSlackUsers()
      } catch (err) {
        this.logger.error('failed to list active slack users:', err)
      }
      this.logger.debug('fetched slack users', this.slackUsers)
    }
  }

  generateParties(): void {
    const partyLen = Math.floor(this.slackUsers.length / 4) || 1
    const restLen = this.slackUsers.length % 4

    const randomized = [...this.slackUsers].sort(() => Math.random() - 0.5)
    const parties: Party[] = []

    for (let i = 0; i < partyLen; i++) {
      const party = new Party()
      const userLen = i < restLen ? 5 : 4
      party.users = randomized.splice(0, userLen)

      parties[i] = party
    }

    this.tmpParties = parties
  }

  saveParty(): void {
    try {
      this.store.fixParties(this.lunch.id, this.tmpParties)
    } catch (err) {
      this.logger.error('failed to save parties of lunch:', err)
    }

    this.router.navigateToRoute(RouteConfigs.top.name)
  }
}
