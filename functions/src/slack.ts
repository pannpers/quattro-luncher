import fetch from 'node-fetch'

enum SlackMethod {
  ListUsers = 'users.list',
  PostMessage = 'chat.postMessage',
}

export enum Channels {
  Test = 'CLQGYUAUB',
  QuattroLunch = 'CBRHVRLQ3',
}

export interface SlackUser {
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

enum HttpMethods {
  Get = 'GET',
  Post = 'POST',
}

// https://api.slack.com/messaging/composing/layouts#attachments
interface Attachment {
  color: string
  title: string
  pretext?: string
  text: string
}

// https://api.slack.com/web
export class SlackService {
  private baseUrl = 'https://slack.com/api/'

  constructor(private token: string) {}

  // https://api.slack.com/methods/chat.postMessage
  async notifyNewParties(channel: Channels, leaderId: string, memberIds: string[]): Promise<void> {
    const attachment: Attachment = {
      color: this.getRandomColor(),
      title: `Leader: <@${leaderId}>`,
      text: `${memberIds.map(id => `<@${id}>`).join(', ')}`,
    }
    const body = {
      channel,
      attachments: [attachment],
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
      throw new Error(`failed to notify a new party: ${respBody}`)
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

    const slackUsers = await resp
      .json()
      .then(body => body.members as SlackUser[])
      .catch(err => {
        throw err
      })

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
