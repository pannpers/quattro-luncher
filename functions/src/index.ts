import * as functions from 'firebase-functions'
import fetch from 'node-fetch'

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

enum SlackMethod {
  ListUsers = 'users.list',
}

interface SlackUser {
  id: string
  deleted: boolean
  profile: {
    real_name: string
    display_name: string
    image_original: string
  }
  is_admin: boolean
  is_restricted: boolean
}

enum Collection {
  Users = 'users',
  SlackUsers = 'slack-users',
  Lunches = 'lunches',
  Parties = 'parties',
}

export interface SlackUserDoc {
  displayName: string
  realName: string
  imageOriginal: string
  isAdmin: boolean
  isRestricted: boolean
}

export const updateUsers = functions.region(tokyoRegion).https.onRequest(async (request, response) => {
  // Fetch Slack users
  const resp = await fetch(slackBaseUrl + SlackMethod.ListUsers, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.slack.token}`,
    },
  }).catch(err => {
    console.error('failed to get all users:', err)
    throw err
  })

  if (!resp.ok) {
    console.error(`failed to get all users:`, resp.json())
    throw new Error(`code: ${resp.status}, message: ${resp.statusText}`)
  }

  const slackUsers = (await resp
    .json()
    .then(body => body.members as SlackUser[])
    .catch(err => {
      throw err
    })).filter(user => !user.deleted)

  console.info('fetched slack users successfully, len:', slackUsers.length)

  const store = admin.firestore()
  const batch = store.batch()
  const slackUserCol = store.collection(Collection.SlackUsers)

  slackUsers.forEach(user => {
    const prof = user.profile
    const doc: SlackUserDoc = {
      displayName: user.profile.display_name || '',
      realName: prof.real_name || '',
      imageOriginal: prof.image_original || '',
      isAdmin: user.is_restricted || false,
      isRestricted: user.is_restricted || false,
    }
    const ref = slackUserCol.doc(user.id)
    batch.set(ref, doc)
  })

  const result = await batch.commit().catch(err => {
    console.error('failed to update slack users in bulk', err)
    throw err
  })
  console.info('update Slack users successful', result)

  response.send('ok')
})
