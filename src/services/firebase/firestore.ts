import { getLogger } from 'aurelia-logging'
import { Lunch } from 'models/lunch'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { Party } from 'models/party'
import { User } from 'models/user'

enum Collection {
  Users = 'users',
  Lunches = 'lunches',
  Parties = 'parties',
}

enum Sort {
  Asc = 'asc',
  Desc = 'desc',
}

export interface LunchDoc {
  backNumber: number
  lunchDate: firebase.firestore.Timestamp
  parties: Party[]
  skipUserIds: number[]
}

export interface PartyDoc {
  leader: UserDoc
  users: UserDoc[]
}

export interface UserDoc {
  slackId: string
  displayName: string
  isActive: boolean
}

export class FirestoreService {
  private readonly logger = getLogger(FirestoreService.name)

  constructor(private store: firebase.firestore.Firestore) {}

  public async listUsers(): Promise<User[]> {
    const snapshot = await this.store
      .collection(Collection.Users)
      .get()
      .catch(err => {
        this.logger.error('failed to get all users', err)
        throw err
      })

    this.logger.debug('users:', snapshot)
    if (snapshot.empty) {
      return []
    }

    return snapshot.docs.map(doc => {
      const d = doc.data() as UserDoc
      return new User(doc.id, d.slackId, d.displayName, d.isActive)
    })
  }

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

    return new Lunch(doc.id, d.backNumber, d.lunchDate.toDate(), d.parties, d.skipUserIds)
  }

  public async fixParties(luncId: string, parties: Party[]) {
    const lunchRef = this.store.collection(Collection.Lunches).doc(luncId)
    parties.forEach(party => {
      this.logger.info('party:', party)
      const leaderRef = this.store.collection(Collection.Users).doc(party.leader.id)
      const userRefs = party.users.map(user => this.store.collection(Collection.Users).doc(user.id))

      lunchRef.collection(Collection.Parties).add({
        leader: leaderRef,
        users: userRefs,
      })
    })
  }
}
