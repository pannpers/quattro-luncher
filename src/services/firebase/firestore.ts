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
  parties: PartyDoc[]
  skipUserIds: number[]
}

export interface PartyDoc {
  leader: firebase.firestore.DocumentReference
  members: firebase.firestore.DocumentReference[]
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

export interface PhotoDoc {
  storagePath: string
  smileScore: number
  // faceAnnotation:
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
    const lunchDoc = doc.data() as LunchDoc
    this.logger.debug('LunchDoc', lunchDoc)

    const partySnapshot = await doc.ref
      .collection(Collection.Parties)
      .get()
      .catch(err => {
        this.logger.error('failed to get parties', err)
        throw err
      })
    let parties = []
    if (!partySnapshot.empty) {
      const partyProm = partySnapshot.docs.map(this.getPartyFrom)
      parties = await Promise.all(partyProm)
    }
    this.logger.info('parties', parties)

    return new Lunch(doc.id, lunchDoc.backNumber, lunchDoc.lunchDate.toDate(), parties, lunchDoc.skipUserIds)
  }

  public async fixParties(luncId: string, parties: Party[]): Promise<void> {
    const lunchRef = this.store.collection(Collection.Lunches).doc(luncId)
    parties.forEach(party => {
      this.logger.debug('party:', party)
      const leaderRef = this.store.collection(Collection.SlackUsers).doc(party.leader.id)
      const memberRefs = party.members.map(member =>
        this.store.collection(Collection.SlackUsers).doc(member.id),
      )
      const src: PartyDoc = {
        leader: leaderRef,
        members: memberRefs,
      }

      lunchRef.collection(Collection.Parties).add(src)
    })
  }

  private getPartyFrom = async (partySnapshot: firebase.firestore.QueryDocumentSnapshot): Promise<Party> => {
    const partyDoc = partySnapshot.data() as PartyDoc

    const leaderSnap = await partyDoc.leader.get()
    const leader = await this.getSlackUser(leaderSnap)

    const promises = partyDoc.members.map(async userDocRef => {
      const userSnap = await userDocRef.get()
      return this.getSlackUser(userSnap)
    })
    const members = await Promise.all(promises)

    const party = new Party()
    party.id = partySnapshot.id
    party.leader = leader
    party.members = members

    return party
  }

  private async getSlackUser(snapshot: firebase.firestore.DocumentSnapshot): Promise<SlackUser> {
    return SlackUser.fromObj(snapshot.id, snapshot.data() as SlackUserDoc)
  }
}
