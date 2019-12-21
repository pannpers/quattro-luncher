enum SlackMethod {
  ListUsers = 'users.list',
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

export class SlackService {
  constructor(private baseUrl: string, private token: string) {}

  async listUsers(): Promise<SlackUser[]> {
    const resp = await fetch(this.baseUrl + SlackMethod.ListUsers, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
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
}
