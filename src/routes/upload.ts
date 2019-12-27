import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { StorageService } from 'services/firebase/storage'
import { FirestoreService } from 'services/firebase/firestore'
import { Lunch } from 'models/lunch'
import { Party } from 'models/party'
import { AuthService } from 'services/firebase/auth'

@autoinject
export class Upload {
  private readonly logger = getLogger(Upload.name)

  lunch: Lunch | null = null
  selectedFiles: File[] = []
  objectUrl = ''

  constructor(private storage: StorageService, private store: FirestoreService, private auth: AuthService) {}

  async attached(): Promise<void> {
    this.lunch = await this.store.getLatestLunch()
  }

  setObjectUrl(): void {
    if (this.selectedFiles.length === 0) {
      this.objectUrl = ''
      return
    }
    this.objectUrl = URL.createObjectURL(this.selectedFiles[0])
    this.logger.debug('objectUrl', this.objectUrl)
  }

  async upload(): Promise<void> {
    this.selectedFiles[0]
    const party = this.findMyParty()
    if (!party) {
      this.logger.warn(`your party not found`)
      return
    }
    if (this.selectedFiles.length === 0) {
      this.logger.warn(`must select file`)
      return
    }
    const file = this.selectedFiles[0]
    this.logger.debug(`upload file: `, file)
    try {
      await this.storage.upload(this.lunch, party.id, file)
    } catch (err) {
      this.logger.error(`failed to upload file ${file}`, err)
      return
    }
    this.logger.info('successfully uploaded')
  }

  private findMyParty(): Party | undefined {
    return this.lunch.parties.find(party =>
      party.users.find(user => user.uid === this.auth.auth.currentUser.uid),
    )
  }
}
