import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { FirestoreService } from "services/firebase/firestore";
import { SlackUser } from 'models/slack-user';

@autoinject
export class Admin {
  private readonly logger = getLogger(Admin.name)

  slackUsers: SlackUser[] = []

  constructor(private store: FirestoreService) {}

  async attached() {
    this.slackUsers = await this.store.listSlackUsers()
  }

  updateActive(user: SlackUser): Promise<void> {
    return this.store.updateActiveSlackUser(user.id, user.isActive || false)
  }
}
