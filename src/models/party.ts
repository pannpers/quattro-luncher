import { SlackUser } from './slack-user'

export class Party {
  public id: string
  public leader: SlackUser
  public members: SlackUser[]
}
