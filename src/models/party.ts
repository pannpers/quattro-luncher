import { computedFrom } from 'aurelia-framework'
import { SlackUser } from './slack-user'

export class Party {
  public id: string
  public users: SlackUser[]

  @computedFrom('users')
  get leader(): SlackUser {
    return this.users[0]
  }

  @computedFrom('users')
  get members(): SlackUser[] {
    return this.users.slice(1)
  }
}
