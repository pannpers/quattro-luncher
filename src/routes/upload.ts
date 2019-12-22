import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { StorageService } from 'services/firebase/storage'
import { FirestoreService } from 'services/firebase/firestore'
import { Lunch } from 'models/lunch'

@autoinject
export class Upload {
  private readonly logger = getLogger(Upload.name)

  lunch: Lunch | null = null
  selectedFiles: File[] = []

  constructor(private storage: StorageService, private store: FirestoreService) {}

  async attached(): Promise<void> {
    this.lunch = await this.store.getLatestLunch()
  }

  async upload(): Promise<void> {
    const dummy = new Date()
    const partyId = this.lunch.parties[0].id
    const file = this.selectedFiles[0]
    this.logger.debug(`upload file: `, file.type)
    try {
      await this.storage.upload(this.lunch, file, file.type)
    } catch (err) {
      this.logger.error(`failed to upload file ${file}`, err)
      return
    }
    this.logger.info('successfully uploaded')
  }
}
