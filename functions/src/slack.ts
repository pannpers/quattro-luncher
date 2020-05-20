/* eslint-disable @typescript-eslint/camelcase */
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as FormData from 'form-data'
import { IgMedia } from './instagram'

enum SlackMethod {
  ListUsers = 'users.list',
  PostMessage = 'chat.postMessage',
  UploadFile = 'files.upload',
}

export enum Channels {
  Test = 'CLQGYUAUB',
  QuattroLunch = 'CBRHVRLQ3',
}

export enum SlackUserIds {
  Wara = 'U9WE64KL4',
}

export enum SlackOtokoUserIds {
  Pandy = 'UM1BM18QL',
  Takkun = 'U6GTM65D2',
  Char = 'UD3DGCV1N',
  Peta = 'U8WPRJCNA',
  Michi = 'UGVBXMC4X',
  Toru = 'U135T2Z50',
}

export const getOtokoList = (): string[] => Object.values(SlackOtokoUserIds)

export interface SlackUser {
  id: string
  deleted: boolean
  profile: {
    real_name: string
    display_name: string
    image_original: string
    email: string
  }
  is_admin: boolean
  is_restricted: boolean
}

enum HttpMethods {
  Get = 'GET',
  Post = 'POST',
}

enum Emojis {
  Star = ':star:',
  ShiningStar = ':star2:',
}

// https://api.slack.com/messaging/composing/layouts#attachments
interface Attachment {
  color: string
  title: string
  pretext?: string
  text: string
}

// https://api.slack.com/reference/block-kit/blocks#section
interface SectionBlock {
  type: 'section'
  text: Text
  fields?: Record<string, any>
  accessory?: ImageElement
}

// https://api.slack.com/reference/block-kit/block-elements#image
interface ImageElement {
  type: 'image'
  image_url: string
  alt_text: string
}

// https://api.slack.com/reference/block-kit/composition-objects#text
interface Text {
  type: 'plain_text' | 'mrkdwn'
  text: string
}

// https://api.slack.com/web
export class SlackService {
  private baseUrl = 'https://slack.com/api/'

  constructor(private token: string, private channel: Channels) {}

  private getSmileScoreMessage(score: number): string {
    const intPart = Math.floor(score)
    const splited = score.toString().split('.')
    const decmPart = splited.length === 2 ? Number.parseInt(splited[1][0], 10) : 0

    const stars: string[] = []
    for (let i = 0; i < intPart; i++) {
      stars.push(Emojis.ShiningStar)
    }
    if (decmPart > 0) {
      stars.push(Emojis.Star)
    }

    return `Smile Score is ${score}!! ${stars.join(' ')}`
  }

  async notifySmileScore(filePath: string, score: number): Promise<void> {
    const form = new FormData()
    form.append('channels', this.channel)
    form.append('file', fs.createReadStream(filePath))
    form.append('initial_comment', this.getSmileScoreMessage(score))
    form.append('token', this.token)

    const resp = await fetch(this.baseUrl + SlackMethod.UploadFile, {
      method: HttpMethods.Post,
      body: form,
    }).catch(err => {
      throw new Error(`failed to post slack message: ${err}`)
    })

    if (!resp.ok) {
      throw new Error(`failed to post a message, code: ${resp.status}, message: ${resp.statusText}`)
    }

    const respBody = await resp.json()
    if (!respBody.ok) {
      throw new Error(`failed to notify smile score: ${JSON.stringify(respBody)}`)
    }
  }

  // https://api.slack.com/methods/chat.postMessage
  async notifyNewParties(slackUserIds: string[], media: IgMedia): Promise<void> {
    const members = slackUserIds.slice(1)
    const attachment: Attachment = {
      color: this.getRandomColor(),
      // pretext: media.permalink,
      title: `Leader: <@${slackUserIds[0]}>`,
      text: `${members.map(id => `<@${id}>`).join(', ')}`,
    }
    const blocks: SectionBlock[] = [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: media.caption,
        },
        accessory: {
          type: 'image',
          image_url: media.media_url,
          alt_text: 'media_url',
        },
      },
    ]
    console.debug('this blocks is not used', blocks)

    const body = {
      channel: this.channel,
      attachments: [attachment],
      // blocks,
      as_user: false,
    }
    console.debug('request', JSON.stringify(body))

    const resp = await fetch(this.baseUrl + SlackMethod.PostMessage, {
      method: HttpMethods.Post,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    }).catch(err => {
      throw new Error(`failed to notify new parties: ${err}`)
    })

    if (!resp.ok) {
      throw new Error(`failed to post a message, code: ${resp.status}, message: ${resp.statusText}`)
    }

    const respBody = await resp.json()
    if (!respBody.ok) {
      throw new Error(`failed to notify a new party: ${JSON.stringify(respBody)}`)
    }
  }

  // https://api.slack.com/methods/users.list
  async listUsers(): Promise<SlackUser[]> {
    const resp = await fetch(this.baseUrl + SlackMethod.ListUsers, {
      method: HttpMethods.Get,
      headers: this.getAuthHeader(),
    }).catch(err => {
      throw new Error(`failed to get all users: ${err}`)
    })

    if (!resp.ok) {
      throw new Error(`failed to get all users, code: ${resp.status}, message: ${resp.statusText}`)
    }

    const respBody = await resp.json()
    if (!respBody.ok) {
      throw new Error(`failed to notify a new party: ${respBody}`)
    }

    const slackUsers = respBody.members as SlackUser[]

    return slackUsers.filter(user => !user.deleted)
  }

  private getAuthHeader(): { [key: string]: string } {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    }
  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)]
    }
    return color
  }
}
