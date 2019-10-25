import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { Router } from 'aurelia-router'
import { Lunch } from 'models/lunch'
import { Party } from 'models/party'
import { User } from 'models/user'
import { AuthService } from 'services/firebase/auth'
import { FirestoreService } from 'services/firebase/firestore'

@autoinject
export class Top {
  private readonly logger = getLogger(Top.name)

  lunch: Lunch | null = null
  users: User[] = []
  tmpParties: Party[] = []

  constructor(private router: Router, private auth: AuthService, private store: FirestoreService) {}

  async activate(): Promise<void> {
    this.lunch = await this.store.getLatestLunch()

    if (!this.lunch.hasPartyFixed()) {
      this.users = await this.store.listUsers()
      this.logger.info('users fetched', this.users)
    }
  }

  generateParties() {
    const partyLen = Math.floor(this.users.length / 4) || 1
    const restLen = this.users.length % 4

    const randomized = [...this.users].sort(() => Math.random() - 0.5)
    const parties: Party[] = []

    for (let i = 0; i < partyLen; i++) {
      const party = new Party()
      party.leader = randomized.shift()
      const userLen = i < restLen ? 4 : 3
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
  }

  signOut(): void {
    this.auth.signOut()
    this.router.navigateToRoute('sign-in')
  }
}
