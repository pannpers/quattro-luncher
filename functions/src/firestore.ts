import { addDays, setHours, startOfHour } from 'date-fns'
import { SlackUser } from './slack'
import { FaceAnnotation } from './cloud-vision'

import admin = require('firebase-admin')

export enum Collection {
  Users = 'users',
  SlackUsers = 'slack-users',
  Lunches = 'lunches',
  Parties = 'parties',
  Photos = 'photos',
}

export interface SlackUserDoc {
  uid?: string
  displayName: string
  realName: string
  email: string
  imageOriginal: string
  isAdmin: boolean
  isRestricted: boolean
  isActive?: boolean
}

export interface LunchDoc {
  backNumber: number
  lunchDate: admin.firestore.Timestamp | Date
  parties?: PartyDoc[]
  skipUserIds?: number[]
}

export interface PartyDoc {
  users: FirebaseFirestore.DocumentReference[]
  photo: PhotoDoc
}

export interface PhotoDoc {
  storagePath: string
  smileScore: number
  faceAnnotations: FaceAnnotation[]
}

export class FirestoreService {
  constructor(private store: FirebaseFirestore.Firestore) {}

  async updateSlackUsers(users: SlackUser[]): Promise<void> {
    const batch = this.store.batch()
    const slackUserCol = this.store.collection(Collection.SlackUsers)

    const queues = users.map(async user => {
      const prof = user.profile
      const doc: SlackUserDoc = {
        displayName: user.profile.display_name || '',
        email: user.profile.email || '',
        realName: prof.real_name || '',
        imageOriginal: prof.image_original || '',
        isAdmin: user.is_restricted || false,
        isRestricted: user.is_restricted || false,
      }
      const ref = slackUserCol.doc(user.id)
      const r = await ref.get()
      if (r.exists) {
        return batch.update(ref, doc)
      }
      return batch.set(ref, doc)
    })

    await Promise.all(queues)
    await batch.commit().catch(err => {
      throw new Error(`failed to update slack users in bulk: ${err}`)
    })
    console.info('update Slack users successful')
  }

  async addPhotoToParty(lunchId: string, partyId: string, photo: PhotoDoc): Promise<void> {
    const photoRef = await this.store.collection(Collection.Photos).add(photo)

    await this.store
      .collection(Collection.Lunches)
      .doc(lunchId)
      .collection(Collection.Parties)
      .doc(partyId)
      .update({ photo: photoRef })
  }

  async addNextLunch(): Promise<void> {
    const lunchRef = this.store.collection(Collection.Lunches)

    const snapshot = await lunchRef
      .orderBy('lunchDate', 'desc')
      .limit(1)
      .get()
      .catch(err => {
        console.error(`failed to get latest lunch`, err)
        throw err
      })

    if (snapshot.empty) {
      return
    }
    const doc = snapshot.docs[0]
    const lunchDoc = doc.data() as LunchDoc
    console.debug('Latest LunchDoc', lunchDoc)

    const today = startOfHour(setHours(new Date(), 13))
    const nextLunchDate = addDays(today, 6)

    const src: LunchDoc = {
      backNumber: lunchDoc.backNumber + 1,
      lunchDate: nextLunchDate,
    }

    try {
      await lunchRef.add(src)
    } catch (err) {
      console.error(`failed to add next lunch doc`, err)
      throw err
    }
  }

  async makeRelationWithSlackUser(userRec: admin.auth.UserRecord): Promise<void> {
    const snapshot = await this.store
      .collection(Collection.SlackUsers)
      .where('email', '==', userRec.email)
      .get()

    if (snapshot.empty) {
      return
    }

    if (snapshot.size !== 1) {
      console.warn(`${snapshot.size} SlackUserDoc found by ${userRec.email}`)
    }
    await snapshot.docs[0].ref.update({ uid: userRec.uid })
  }
}
