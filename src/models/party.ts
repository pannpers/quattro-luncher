import { PartyDoc } from 'services/firebase/firestore'
import { User } from './user'

export class Party {
  public id: string
  public leader: User
  public users: User[]
}
