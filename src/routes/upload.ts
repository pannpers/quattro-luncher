import { autoinject } from 'aurelia-framework'
import { getLogger } from 'aurelia-logging'
import { StorageService } from 'services/firebase/storage'

@autoinject
export class Upload {
  private readonly logger = getLogger(Upload.name)

  selectedFiles: File[] = []

  constructor(private storage: StorageService) {}

  async upload(): Promise<void> {
    const dummy = new Date()
    const file = this.selectedFiles[0]
    this.logger.debug(`upload file: `, file.type)
    try {
      await this.storage.upload(dummy, 'test', file, file.type)
    } catch (err) {
      this.logger.error(`failed to upload file ${file}`, err)
      return
    }
    this.logger.info('successfully uploaded')
  }
}
