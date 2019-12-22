import { computedFrom } from 'aurelia-framework'
import { SlackUserDoc } from 'services/firebase/firestore'

export class SlackUser {
  constructor(
    public id: string,
    public displayName: string,
    public realName: string,
    public imageOriginal: string,
    public isAdmin: boolean,
    public isRestricted: boolean,
    public isActive: boolean,
  ) {}

  @computedFrom('displayName', 'realName')
  get name(): string {
    return this.displayName || this.realName
  }

  static fromObj(id: string, doc: SlackUserDoc): SlackUser {
    return new SlackUser(id, doc.displayName, doc.realName, doc.imageOriginal, doc.isAdmin, doc.isRestricted, !!doc.isActive)
  }
}
