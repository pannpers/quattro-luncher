import { Party } from './party'

export class Lunch {
  constructor(
    public id: string,
    public backNumber: number,
    public lunchDate: Date,
    public parties: Party[] = [],
    public skipUserIds: number[],
  ) {}

  public hasPartyFixed(): boolean {
    return this.parties.length >= 1
  }
}
