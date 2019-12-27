import { computedFrom } from 'aurelia-framework'
import { SlackUserDoc } from 'services/firebase/firestore'

export class SlackUser {
  public uid: string

  constructor(
    public id: string,
    public displayName: string,
    public email: string = '',
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
    const u = new SlackUser(
      id,
      doc.displayName,
      doc.email,
      doc.realName,
      doc.imageOriginal,
      doc.isAdmin,
      doc.isRestricted,
      !!doc.isActive,
    )
    if (doc.uid) {
      u.uid = doc.uid
    }
    return u
  }
}
