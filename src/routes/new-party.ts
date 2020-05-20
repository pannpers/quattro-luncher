import { RouteConfigs } from 'app'
import { computedFrom, autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { Router } from 'aurelia-router'
import { Lunch } from 'models/lunch'
import { Party } from 'models/party'
import { SlackUser } from 'models/slack-user'
import { FirestoreService } from 'services/firebase/firestore'
import { AuthService } from 'services/firebase/auth'

@autoinject
export class NewParty {
  private readonly logger = getLogger(NewParty.name)
  private readonly numOfMembers = 8

  lunch: Lunch | null = null
  slackUsers: SlackUser[] = []
  tmpParties: Party[] = []

  constructor(private router: Router, private store: FirestoreService, private auth: AuthService) {}

  async attached(): Promise<void> {
    try {
      this.lunch = await this.store.getLatestLunch()
    } catch (err) {
      this.logger.error('failed to latest lunch:', err)
    }
    this.logger.debug('fetched next lunch:', this.lunch)

    if (this.lunch.hasFixedParties) {
      return
    }
    try {
      this.slackUsers = await this.store.listActiveSlackUsers()
    } catch (err) {
      this.logger.error('failed to list active slack users:', err)
    }
    this.logger.debug('fetched slack users', this.slackUsers)
  }

  @computedFrom('tmpParties')
  get canFixParties(): boolean {
    return this.auth.isAdmin && this.tmpParties.length > 0
  }

  generateParties(): void {
    const partyLen = Math.floor(this.slackUsers.length / this.numOfMembers) || 1
    const remainder = this.slackUsers.length % this.numOfMembers

    const randomized = [...this.slackUsers].sort(() => Math.random() - 0.5)
    const parties: Party[] = []

    for (let i = 0; i < partyLen; i++) {
      const party = new Party()
      const userLen = i < remainder ? this.numOfMembers + 1 : this.numOfMembers
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

    this.router.navigateToRoute(RouteConfigs.home.name)
  }
}
