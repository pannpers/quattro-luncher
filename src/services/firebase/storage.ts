import { getLogger } from 'aurelia-logging'
import { Lunch } from 'models/lunch'

export class StorageService {
  private readonly logger = getLogger(StorageService.name)

  private imageRef: firebase.storage.Reference

  constructor(private storage: firebase.storage.Storage) {
    this.imageRef = this.storage.ref().child('images')
  }

  async upload(lunch: Lunch, partyId: string, file: Blob | File): Promise<void> {
    const yyyy = lunch.lunchDate.getFullYear()
    const mm = (lunch.lunchDate.getMonth() + 1).toString().padStart(2, '0')
    const metadata: firebase.storage.UploadMetadata = {
      contentType: file.type,
      customMetadata: {
        lunchId: lunch.id,
        partyId,
      },
    }

    const ref = this.imageRef.child(`${yyyy}/${mm}/${partyId}.png`)
    try {
      const snapshot = await ref.put(file, metadata)
    } catch (err) {
      this.logger.error('failed to upload image', err)
    }
  }
}
