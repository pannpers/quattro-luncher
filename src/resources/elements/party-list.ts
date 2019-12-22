import {bindable} from 'aurelia-framework';
import { Party } from 'models/party';

export class PartyList {
  @bindable parties: Party[] = [];

  constructor() {}
}
