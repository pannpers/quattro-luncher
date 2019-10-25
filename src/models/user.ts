export class User {
  constructor(
    public id: string,
    public slackId: string,
    public displayName: string,
    public isActive: boolean,
  ) {}
}
