// PBFace.ts
//
// This class describes a face of a columbarium
// The face is made up of rows.  Each row has
// multiple niches.  A niche can have one or
// two urns.

import {PBGrave} from './PBGrave.js';
import {GraveInfo, GraveState, SerializablePlot, SerializableFace, NicheInfo} from './PBInterfaces.js';
import {PBRow} from './PBRow.js';
import {PBConst} from "./PBConst.js";

const DEFAULT_COLUMBARIUM_NAME = "Columbarium A";
const DEFAULT_FACE_NAME = "North Face";
const DEFAULT_SHORT_NAME = "SN";
const DEFAULT_NUM_ROWS = 3;

class PBFace implements SerializableFace {
  //
  columbariumName: string;
  faceName: string;
  shortName: string;
  numRows: number;
  rows: Array<PBRow>

  constructor(theSF: SerializableFace) {
    this.deSerialize(theSF);
  }

  deSerialize(theSF: SerializableFace) {
    if (theSF == null)
      theSF = {columbariumName: DEFAULT_COLUMBARIUM_NAME, faceName: DEFAULT_FACE_NAME, shortName: DEFAULT_SHORT_NAME, numRows: DEFAULT_NUM_ROWS, rows: []};
    this.columbariumName = !(theSF.columbariumName == null) ? theSF.columbariumName : DEFAULT_COLUMBARIUM_NAME;
    this.faceName = !(theSF.faceName == null) ? theSF.faceName : DEFAULT_FACE_NAME;
    this.shortName = !(theSF.shortName == null) ? theSF.shortName : DEFAULT_SHORT_NAME;
    this.numRows = !(theSF.numRows == null) ? theSF.numRows : DEFAULT_NUM_ROWS;

    this.rows = new Array<PBRow>();
    for (let index: number = 0; index < this.numRows; index++) {
      if (theSF.rows && theSF.rows[index]) {
        this.rows.push(new PBRow(theSF.rows[index]));
      } else {
        this.rows.push(new PBRow(null));
      }
    }
  }

  serialize(padding: string): string {
    let theJSON: string = padding + '{ ';  // Start the face object.
    theJSON += '"columbariumName" : ' + JSON.stringify(this.columbariumName) + ', ';
    theJSON += '"faceName": ' + JSON.stringify(this.faceName) + ', ';
    theJSON += '"shortName": ' + JSON.stringify(this.shortName) + ', ';
    theJSON += '"numRows": ' + JSON.stringify(this.numRows) + ', ';

    theJSON += '\n' + padding + '  "rows": [\n';  // Start rows array
    this.rows.forEach((theRow: PBRow, index: number) => {
      theJSON += theRow.serialize(padding + '    ');
      theJSON += (index < (this.numRows - 1)) ? ',\n' : ''; // No comma on the last row
    });
    theJSON += ' ] '; // Finish rows array

    theJSON += '}'; // Finish the face object.
    return(theJSON);
  }

  getGraveInfo(baseGraveInfo: GraveInfo, baseNicheInfo: NicheInfo): Array<GraveInfo> {
    let theGraveInfos: Array<GraveInfo> = [];
    if (baseGraveInfo && baseNicheInfo && this.rows) {
      baseNicheInfo.faceName = this.faceName;
      this.rows.forEach((theRow: PBRow, index: number) => {
        baseNicheInfo.rowIndex = index;
        theGraveInfos = theGraveInfos.concat(theRow.getGraveInfo(baseGraveInfo, baseNicheInfo));
      })
    }
    return(theGraveInfos);
  }

  removeNiche(nicheInfo: NicheInfo): PBGrave {
    return(this.rows[nicheInfo.rowIndex].removeNiche(nicheInfo.nicheIndex));
  }

  setNiche(graveInfo: GraveInfo) {
    this.rows[graveInfo.theNiche.rowIndex].setNiche(graveInfo);
  }

}

export {PBFace};