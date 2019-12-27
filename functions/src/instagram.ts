import fetch from 'node-fetch'

export enum HashTagIds {
  GotandaLunch = '17843813020037595',
  HanamaruUdon = '17842225729000711',
  NihonsyuGenkaSyuzo = '17855294551074968',
}

export enum IgUserNames {
  BijoZukan = 'bijo_zukan',
}

// https://developers.facebook.com/docs/instagram-api/reference/hashtag/top-media
export interface IgMedia {
  id: string
  media_type: string
  permalink: string
  media_url: string
  caption: string
  like_count: number
  comments_count: number
}

// https://developers.facebook.com/docs/instagram-api/reference
// https://arrown-blog.com/instagram-graph-api/
// https://web.analogstd.com/tips/posts/api/instagram-grapgh-api-facebook.php
export class InstagramService {
  private readonly origin = 'https://graph.facebook.com'
  private readonly mediaFields = `id,media_type,permalink,media_url,caption,like_count,comments_count`

  constructor(private apiVersion: string, private userId: string, private accessToken: string) {}

  /**
   * https://developers.facebook.com/docs/instagram-api/reference/ig-hashtag-search
   * @param hashTag IG hashtag name.
   */
  async searchHashTagId(hashTag: string): Promise<string> {
    const params = this.getDefaultParams()
    params.set('q', hashTag)
    const resp = await fetch(this.composeUrl('ig_hashtag_search', params))
    if (!resp.ok) {
      throw new Error(`failed to search hashtag ID, code: ${resp.status}, message: ${resp.statusText}`)
    }

    const respBody = await resp.json()
    if (respBody.error) {
      throw new Error(`failed to search hashtag ID: ${respBody.error}`)
    }

    const hashTags = respBody.data
    return hashTags.length > 0 ? hashTags[0].id : ''
  }

  /**
   * https://developers.facebook.com/docs/instagram-api/reference/hashtag/top-media
   * @param hashTagId IG hashtag ID.
   */
  async listTopMediaBy(hashTagId: HashTagIds): Promise<IgMedia[]> {
    const params = this.getDefaultParams()
    params.set('fields', this.mediaFields)
    const resp = await fetch(this.composeUrl(`${hashTagId}/top_media`, params))
    if (!resp.ok) {
      throw new Error(`failed to list top medias, code: ${resp.status}, message: ${resp.statusText}`)
    }

    const respBody = await resp.json()
    if (respBody.error) {
      throw new Error(`failed to list top medias: ${respBody.error}`)
    }

    return this.filerImage(respBody.data)
  }

  async pickTopMediaBy(hashTagId: HashTagIds): Promise<IgMedia> {
    const medias = await this.listTopMediaBy(hashTagId)
    return this.pickRandomMedia(this.filerImage(medias))
  }

  /**
   * https://developers.facebook.com/docs/instagram-api/reference/user/business_discovery
   * @param username Other IG user name.
   */
  async pickMediasOf(username: IgUserNames): Promise<IgMedia> {
    const params = this.getDefaultParams()
    params.set('fields', `business_discovery.username(${username}){media{${this.mediaFields}}}`)
    const resp = await fetch(this.composeUrl(`${this.userId}`, params))
    if (!resp.ok) {
      throw new Error(`failed to list medias, code: ${resp.status}, message: ${resp.statusText}`)
    }

    const respBody = await resp.json()
    if (respBody.error) {
      throw new Error(`failed to list medias: ${respBody.error}`)
    }

    return this.pickRandomMedia(this.filerImage(respBody.business_discovery.media.data))
  }

  pickRandomMedia(medias: IgMedia[]): IgMedia {
    return medias[Math.floor(Math.random() * medias.length)]
  }

  private composeUrl(path: string, params: URLSearchParams): string {
    return `${this.origin}/${this.apiVersion}/${path}?${params.toString()}`
  }

  private getDefaultParams(): URLSearchParams {
    const params = new URLSearchParams()
    params.set('user_id', this.userId)
    params.set('access_token', this.accessToken)

    return params
  }

  private filerImage(medias: IgMedia[]): IgMedia[] {
    return medias.filter(m => m.media_type === 'IMAGE')
  }
}
