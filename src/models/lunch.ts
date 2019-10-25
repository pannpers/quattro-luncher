export class Lunch {
  constructor(
    private id: string,
    private backNumber: number,
    private lunchDate: Date,
    private skipUserIds: number[],
  ) {}
}
