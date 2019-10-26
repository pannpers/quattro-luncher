export class SlackUser {
  constructor(
    public id: string,
    public displayName: string,
    public realName: string,
    public imageOriginal: string,
    public isAdmin: boolean,
    public isRestricted: boolean,
  ) {}
}
