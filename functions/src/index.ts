import * as functions from 'firebase-functions'
import * as path from 'path'
import * as os from 'os'
import { CloudVision } from './cloud-vision'
import { SlackService, Channels, SlackUserIds, getOtokoList, SlackOtokoUserIds } from './slack'
import { FirestoreService, PhotoDoc, Collection, PartyDoc } from './firestore'
import { InstagramService, HashTagIds, IgUserNames, IgMedia } from './instagram'

import admin = require('firebase-admin')

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// Initialize Firebase App
// https://firebase.google.com/docs/admin/setup#initialize_the_sdk
interface FunctionsConfig {
  slack: {
    token: string
  }
  instagram: {
    id: string // instagram_business_account
    token: string // access_token
  }
}
const config = functions.config() as FunctionsConfig
admin.initializeApp()

const tokyoRegion = 'asia-northeast1'
const instagramApiVersion = 'v5.0'

export const calculateSmileScore = functions
  .region(tokyoRegion)
  .storage.object()
  .onFinalize(
    async (object, context): Promise<void> => {
      const contentType = object.contentType || ''
      if (!contentType.startsWith('image/')) {
        console.warn('This is not an image:', contentType)
        return
      }
      if (!object.name) {
        console.warn('Object name is empty:', object.name)
        return
      }

      const vision = new CloudVision(object.bucket)
      const faceAnnotations = await vision.detectFace(object.name)
      const smileScore = vision.calculateSmileScore(faceAnnotations)

      console.info(`${faceAnnotations.length} faces detected`)

      const { metadata } = object
      if (!metadata) {
        console.warn('Object metadata is empty')
        return
      }
      const photo: PhotoDoc = {
        storagePath: object.name,
        smileScore,
        faceAnnotations,
      }

      const store = new FirestoreService(admin.firestore())
      await store.addPhotoToParty(metadata.lunchId, metadata.partyId, photo)
    },
  )

export const notifySmileScore = functions
  .region(tokyoRegion)
  .firestore.document(`${Collection.Photos}/{photoId}`)
  .onWrite(async (change, context) => {
    const data = change.after.data() as PhotoDoc

    const fileName = path.basename(data.storagePath)
    const tmpFilePath = path.join(os.tmpdir(), fileName)
    try {
      const bucket = admin.storage().bucket()
      await bucket.file(data.storagePath).download({ destination: tmpFilePath })
    } catch (err) {
      throw new Error(`failed to download ${data.storagePath}: ${err}`)
    }

    const slack = new SlackService(config.slack.token, Channels.QuattroLunch)
    // const slack = new SlackService(config.slack.token, Channels.Test)
    await slack.notifySmileScore(tmpFilePath, data.smileScore)
  })

const pickInstagramMedia = async (instagram: InstagramService, slackUserIds: string[]): Promise<IgMedia> => {
  // find intersection between party members and Otoko
  const otokos = getOtokoList()
  const otokoNum = slackUserIds.filter(id => otokos.includes(id)).length
  if (otokoNum >= 2) {
    return instagram.pickMediasOf(IgUserNames.BijoZukan)
  }
  if (slackUserIds.includes(SlackUserIds.Wara)) {
    return instagram.pickTopMediaBy(HashTagIds.NihonsyuGenkaSyuzo)
  }
  if (slackUserIds.includes(SlackOtokoUserIds.Takkun)) {
    return instagram.pickTopMediaBy(HashTagIds.HanamaruUdon)
  }

  return instagram.pickTopMediaBy(HashTagIds.GotandaLunch)
}

export const notifyNewParties = functions
  .region(tokyoRegion)
  .firestore.document(`${Collection.Lunches}/{lunchId}/${Collection.Parties}/{partyId}`)
  .onCreate(async (snapshot, context) => {
    // const { partyId } = context.params
    const data = snapshot.data() as PartyDoc
    const slackUserIds = data.users.map(userRef => userRef.id)
    console.debug('slackUserIds:', slackUserIds)

    const instagram = new InstagramService(instagramApiVersion, config.instagram.id, config.instagram.token)
    const media = await pickInstagramMedia(instagram, slackUserIds)

    const slack = new SlackService(config.slack.token, Channels.QuattroLunch)
    try {
      await slack.notifyNewParties(slackUserIds, media)
    } catch (err) {
      throw new Error(`failed to notify a new party: ${err}`)
    }
  })

export const makeRelationWithSlackUser = functions
  .region(tokyoRegion)
  .auth.user()
  .onCreate(async user => {
    const store = new FirestoreService(admin.firestore())
    await store.makeRelationWithSlackUser(user)
  })

// https://firebase.google.com/docs/functions/schedule-functions
export const createNextLunchDoc = functions
  .region(tokyoRegion)
  .pubsub.schedule('0 0 * * 5') // https://en.wikipedia.org/wiki/Cron#Overview
  .timeZone('Asia/Tokyo') // https://en.wikipedia.org/wiki/Tz_database
  .onRun(async context => {
    const store = new FirestoreService(admin.firestore())
    await store.addNextLunch()
  })

export const updateSlackUsers = functions.region(tokyoRegion).https.onRequest(async (req, resp) => {
  // Fetch Slack users
  const slack = new SlackService(config.slack.token, Channels.QuattroLunch)
  const slackUsers = await slack.listUsers()

  console.info('fetched slack users successfully, len:', slackUsers.length)

  const store = new FirestoreService(admin.firestore())
  await store.updateSlackUsers(slackUsers)

  resp.send('ok')
})

export const updateUserClaims = functions.region(tokyoRegion).https.onRequest(async (req, resp) => {
  const { uid } = req.body
  const { userClaims } = req.body
  await admin.auth().setCustomUserClaims(uid, userClaims)

  resp.send('ok')
})
