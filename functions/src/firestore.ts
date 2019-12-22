import { SlackUser } from './slack'
import { FaceAnnotation } from './cloud-vision'

enum Collection {
  Users = 'users',
  SlackUsers = 'slack-users',
  Lunches = 'lunches',
  Parties = 'parties',
  FaceAnnotations = 'face-annotations',
}

export interface SlackUserDoc {
  displayName: string
  realName: string
  imageOriginal: string
  isAdmin: boolean
  isRestricted: boolean
  isActive?: boolean
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

    const queues = users.map(async (user) => {
      const prof = user.profile
      const doc: SlackUserDoc = {
        displayName: user.profile.display_name || '',
        realName: prof.real_name || '',
        imageOriginal: prof.image_original || '',
        isAdmin: user.is_restricted || false,
        isRestricted: user.is_restricted || false,
      }
      const ref = slackUserCol.doc(user.id)
      const r = await ref.get()
      if (r.exists) {
        return batch.update(ref, doc)
      } else {
        return batch.set(ref, doc)
      }
    })

    await Promise.all(queues)
    await batch.commit().catch(err => {
      throw new Error(`failed to update slack users in bulk: ${err}`)
    })
    console.info('update Slack users successful')
  }

  async addPhotoToParty(lunchId: string, partyId: string, photo: PhotoDoc): Promise<void> {
    const partyDoc = this.store
      .collection(Collection.Lunches)
      .doc(lunchId)
      .collection(Collection.Parties)
      .doc(partyId)
    await partyDoc.update({ photo })
  }
}
