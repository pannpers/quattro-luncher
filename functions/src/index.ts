import * as functions from 'firebase-functions'
import { CloudVision } from './cloud-vision'
import { SlackService, Channels } from './slack'
import { FirestoreService, PhotoDoc, Collection, PartyDoc } from './firestore'

import admin = require('firebase-admin')

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// Initialize Firebase App
// https://firebase.google.com/docs/admin/setup#initialize_the_sdk
interface FunctionsConfig {
  slack: {
    token: string
  }
}
const config = functions.config() as FunctionsConfig
admin.initializeApp()

const tokyoRegion = 'asia-northeast1'

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
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as PhotoDoc
    data.smileScore
  })

export const notifyNewParties = functions
  .region(tokyoRegion)
  .firestore.document(`${Collection.Lunches}/{lunchId}/${Collection.Parties}/{partyId}`)
  .onCreate(async (snapshot, context) => {
    // const { partyId } = context.params
    const data = snapshot.data() as PartyDoc
    const slackUserIds = data.users.map(userRef => userRef.id)
    console.debug('slackUserIds:', slackUserIds)

    const slack = new SlackService(config.slack.token)
    // return slack.notifyNewParties(Channels.Test, slackUserIds[0], slackUserIds.slice(1))
    try {
      await slack.notifyNewParties(Channels.Test, 'U135T2Z50', [
        'UM1BM18QL',
        'U135T2Z50',
        'U135T2Z50',
        'UM1BM18QL',
      ])
    } catch (err) {
      throw new Error(`failed to notify a new party: ${err}`)
    }
  })

export const updateSlackUsers = functions.region(tokyoRegion).https.onRequest(async (req, resp) => {
  // Fetch Slack users
  const slack = new SlackService(config.slack.token)
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
