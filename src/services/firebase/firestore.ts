import { getLogger } from 'aurelia-logging'
import { Lunch } from 'models/lunch'
import * as firebase from 'firebase/app'
import 'firebase/firestore'

enum Collection {
  Lunches = 'lunches',
}

enum Sort {
  Asc = 'asc',
  Desc = 'desc',
}

interface LunchDoc {
  backNumber: number
  lunchDate: firebase.firestore.Timestamp
  skipUserIds: number[]
}

export class FirestoreService {
  private readonly logger = getLogger(FirestoreService.name)

  constructor(private store: firebase.firestore.Firestore) {}

  public async getLatestLunch(): Promise<Lunch> {
    const snapshot = await this.store
      .collection(Collection.Lunches)
      .orderBy('lunchDate', Sort.Desc)
      .limit(1)
      .get()
      .catch(err => {
        this.logger.error('failed to get latest lunch', err)
        throw err
      })

    if (snapshot.empty) {
      return null
    }
    const doc = snapshot.docs[0]
    const d = doc.data() as LunchDoc

    return new Lunch(doc.id, d.backNumber, d.lunchDate.toDate(), d.skipUserIds)
  }
}
