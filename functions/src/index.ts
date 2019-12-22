import * as functions from 'firebase-functions'
import { CloudVision } from './cloud-vision'
import { SlackService } from './slack'
import { FirestoreService, PhotoDoc } from './firestore'

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
const slackBaseUrl = 'https://slack.com/api/'

export const analyzeSmile = functions
  .region(tokyoRegion)
  .storage.object()
  .onFinalize(
    async (object, context): Promise<void> => {
      console.info('file uploaded:', object.name)

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

export const updateSlackUsers = functions.region(tokyoRegion).https.onRequest(async (req, resp) => {
  // Fetch Slack users
  const slack = new SlackService(slackBaseUrl, config.slack.token)
  const slackUsers = await slack.listUsers()

  console.info('fetched slack users successfully, len:', slackUsers.length)

  const store = new FirestoreService(admin.firestore())
  await store.updateSlackUsers(slackUsers)

  resp.send('ok')
})

export const updateUserClaims = functions.region(tokyoRegion).https.onRequest(async (req, resp) => {
  const uid = req.body.uid
  const userClaims = req.body.userClaims
  await admin.auth().setCustomUserClaims(uid, userClaims)

  resp.send('ok')
})
