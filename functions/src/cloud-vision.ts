/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
const vision: any = require('@google-cloud/vision')

// https://googleapis.dev/nodejs/vision/latest/google.cloud.vision.v1.html#.FaceAnnotation
export interface FaceAnnotation {
  // The bounding polygon around the face. The coordinates of the bounding box
  // are in the original image's scale.
  // The bounding box is computed to "frame" the face in accordance with human
  // expectations. It is based on the landmarker results.
  // Note that one or more x and/or y coordinates may not be generated in the
  // `BoundingPoly` (the polygon will be unbounded) if only a partial face
  // appears in the image to be annotated.
  boundingPoly: number
  // The `fd_bounding_poly` bounding polygon is tighter than the
  // `boundingPoly`, and encloses only the skin part of the face. Typically, it
  // is used to eliminate the face from any image analysis that detects the
  // "amount of skin" visible in an image. It is not based on the
  // landmarker results, only on the initial face detection, hence
  // the <code>fd</code> (face detection) prefix.
  fdBoundingPoly: number
  // Detected face landmarks.
  landmarks: number[]
  // Roll angle, which indicates the amount of clockwise/anti-clockwise rotation
  // of the face relative to the image vertical about the axis perpendicular to
  // the face. Range [-180,180].
  rollAngle: number
  // Yaw angle, which indicates the leftward/rightward angle that the face is
  // pointing relative to the vertical plane perpendicular to the image. Range
  // [-180,180].
  panAngle: number
  // Pitch angle, which indicates the upwards/downwards angle that the face is
  // pointing relative to the image's horizontal plane. Range [-180,180].
  tiltAngle: number
  // Detection confidence. Range [0, 1].
  detectionConfidence: number
  // Face landmarking confidence. Range [0, 1].
  landmarkingConfidence: number
  // Joy likelihood.
  joyLikelihood: LikelihoodType
  // Sorrow likelihood.
  sorrowLikelihood: number
  // Anger likelihood.
  angerLikelihood: number
  // Surprise likelihood.
  surpriseLikelihood: number
  // Under-exposed likelihood.
  underExposedLikelihood: number
  // Blurred likelihood.
  blurredLikelihood: number
  // Headwear likelihood.
  headwearLikelihood: number
}

// https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageResponse#likelihood
export enum LikelihoodType {
  Unknown = 'UNKNOWN',
  VeryUnlikely = 'VERY_UNLIKELY',
  Unlikely = 'UNLIKELY',
  Possible = 'POSSIBLE',
  Likely = 'LIKELY',
  VeryLikely = 'VERY_LIKELY',
}

const smileScoreMapeer: Map<LikelihoodType, number> = new Map([
  [LikelihoodType.Unknown, 1],
  [LikelihoodType.VeryLikely, 1],
  [LikelihoodType.Unlikely, 2],
  [LikelihoodType.Possible, 3],
  [LikelihoodType.Likely, 4],
  [LikelihoodType.VeryLikely, 5],
])

// https://github.com/googleapis/googleapis/blob/master/google/cloud/vision/v1/image_annotator.proto
export class CloudVision {
  private client: any

  constructor(private bucket: string) {
    this.client = new vision.ImageAnnotatorClient()
  }

  /**
   * Annotate a single image in Cloud Storage with face detection.
   * https://googleapis.dev/nodejs/vision/latest/v1.ImageAnnotatorClient.html#faceDetection
   * @param filePath a path string of the object in Cloud Storage.
   */
  async detectFace(filePath: string): Promise<FaceAnnotation[]> {
    try {
      const [result] = await this.client.faceDetection(`gs://${this.bucket}/${filePath}`)
      return result.faceAnnotations
    } catch (err) {
      throw new Error(`failed to detect face using Vision API: ${err}`)
    }
  }

  calculateSmileScore(faces: FaceAnnotation[]): number {
    const scores = faces
      .map(face => face.joyLikelihood)
      .map(likelihood => smileScoreMapeer.get(likelihood) || 0)

    return scores.reduce((accum, val) => accum + val, 0) / scores.length
  }
}
