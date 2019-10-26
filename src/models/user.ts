import { SlackUser } from './slack-user'

export class User {
  constructor(public id: string, public slackUser: SlackUser, public isActive: boolean) {}
}
