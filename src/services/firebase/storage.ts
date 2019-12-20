import { getLogger } from 'aurelia-logging'

export class StorageService {
  private readonly logger = getLogger(StorageService.name)

  private imageRef: firebase.storage.Reference

  constructor(private storage: firebase.storage.Storage) {
    this.imageRef = this.storage.ref().child('images')
  }

  async upload(lunchDate: Date, partyId: string, file: Blob | File, contentType: string): Promise<void> {
    const yyyy = lunchDate.getFullYear()
    const mm = (lunchDate.getMonth() + 1).toString().padStart(2, '0')
    const metadata: firebase.storage.UploadMetadata = {
      contentType,
      customMetadata: {
        partyId,
      },
    }

    const ref = this.imageRef.child(`${yyyy}/${mm}/${partyId}.png`)
    try {
      const snapshot = await ref.put(file, metadata)
      this.logger.debug('downloadURL', snapshot.downloadURL)
    } catch (err) {
      this.logger.error('failed to upload image', err)
    }
  }
}
