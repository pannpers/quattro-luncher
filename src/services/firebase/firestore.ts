import { getLogger } from 'aurelia-logging'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { Lunch } from 'models/lunch'
import { Party } from 'models/party'
import { SlackUser } from 'models/slack-user'

enum Collection {
  Users = 'users',
  SlackUsers = 'slack-users',
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

export interface SlackUserDoc {
  displayName: string
  realName: string
  imageOriginal: string
  isAdmin: boolean
  isRestricted: boolean
}

export class FirestoreService {
  private readonly logger = getLogger(FirestoreService.name)

  constructor(private store: firebase.firestore.Firestore) {}

  public async listSlackUsers(): Promise<SlackUser[]> {
    const snapshot = await this.store
      .collection(Collection.SlackUsers)
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
      const d = doc.data() as SlackUserDoc
      return new SlackUser(doc.id, d.displayName, d.realName, d.imageOriginal, d.isAdmin, d.isRestricted)
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

  public async fixParties(luncId: string, parties: Party[]): Promise<void> {
    const lunchRef = this.store.collection(Collection.Lunches).doc(luncId)
    parties.forEach(party => {
      this.logger.info('party:', party)
      const leaderRef = this.store.collection(Collection.SlackUsers).doc(party.leader.id)
      const memberRefs = party.members.map(member =>
        this.store.collection(Collection.SlackUsers).doc(member.id),
      )

      lunchRef.collection(Collection.Parties).add({
        leader: leaderRef,
        users: memberRefs,
      })
    })
  }
}
