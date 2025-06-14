// PBRow.ts
//
// This class describes a row on a face of a
// columbarium.  It contains multiple niches (graves)
// that can contain one or two urns.

import {PBGrave} from './PBGrave.js';
import {GraveInfo, GraveState, NicheInfo, SerializableRow} from './PBInterfaces.js';

const DEFAULT_NAME = "The Row";
const DEFAULT_NUM_NICHES = 5;
const DEFAULT_URNS = 1;

class PBRow implements SerializableRow {
  // 
  name: string; // The name of the row
  numNiches: number;  // Total number of niches
  graves: Array<PBGrave>; // Each niche has a grave
  urns: Array<number>     // and a number of urns.  Typically 1 or 2

  constructor(theSR: SerializableRow) {
    this.deSerialize(theSR);
  }

  deSerialize(theSR: SerializableRow) {
    if (theSR == null)
      theSR = {name: DEFAULT_NAME, numNiches: DEFAULT_NUM_NICHES, graves: [], urns: []};
    this.name = !(theSR.name == null) ? theSR.name : DEFAULT_NAME;
    this.numNiches = !(theSR.numNiches == null) ? theSR.numNiches : DEFAULT_NUM_NICHES;
    this.graves = new Array(this.numNiches);
    this.urns = new Array(this.numNiches);

    theSR.graves.forEach((theGrave, index) => {
      if (theGrave.hasOwnProperty('name')) { // Only add the actual graves
        this.graves[index] = new PBGrave(theSR.graves[index]);
      }
      this.urns[index] = (theSR.urns[index]) ? theSR.urns[index] : DEFAULT_URNS; // There are always urns
    });

  }

  serialize(padding: string): string {
    let theJSON: string = padding + ' { ';  // Start the row object.
    theJSON += '"name": ' + JSON.stringify(this.name) + ', ';
    theJSON += '"numNiches": ' + JSON.stringify(this.numNiches) + ', ';

    theJSON += '\n' + padding + '   "graves": [';  // Start graves array
    let extraPadding:string = '      '
    for (let index = 0; index < this.numNiches; index++) {
      // JSON does not support undefined, so the undefined items
      // in the array are passed as empty objects, and the valid
      // graves are passed as is.
      let theGrave = this.graves[index];
      if (theGrave) {
        theJSON += theGrave.serialize(padding + extraPadding);
      } else{
        theJSON += '\n' + padding + extraPadding + '{}';
      }
      theJSON += (index == (this.graves.length - 1)) ? '' : ',';  // No comma on the last of the array
    }
    theJSON += '],'; // Finish graves array

    theJSON += '\n' + padding + '   "urns": [ '; // Start urns array
    this.urns.forEach((theUrn: number, index: number) => {
      theJSON += theUrn;
      theJSON += (index == (this.numNiches - 1)) ? '' : ',';  // No comma on the last of the array
    })
    theJSON += ' ]'; // Finish urns array

    theJSON += ' }'; // Finish the row object.
    return(theJSON);
  }

  getGraveInfo(baseGraveInfo: GraveInfo, baseNicheInfo: NicheInfo): Array<GraveInfo> {
    // Returns a fully populated array of GraveInfos complete with NicheInfos.
    // baseGraveInfo and baseNicheInfo contain the basic info that will be needed
    // for each grave and niche.
    let theGraveInfos: Array<GraveInfo> = [];
    if (baseGraveInfo && baseNicheInfo && this.graves) {
      for (let index: number = 0; index < this.graves.length; index++) {
        let theGrave: PBGrave = this.graves[index];
        if (theGrave) { // Sparse array, only add the actual graves
          let theGraveInfo: GraveInfo = {
            cemeteryIndex: baseGraveInfo.cemeteryIndex, plotIndex: baseGraveInfo.plotIndex,
            graveIndex: index, theGrave: theGrave
          };
          theGraveInfo.theNiche = {
            faceIndex: baseNicheInfo.faceIndex, rowIndex: baseNicheInfo.rowIndex,
            nicheIndex: index, faceName: baseNicheInfo.faceName, rowName: this.name,
            urns: this.urns[index]
          };
          theGraveInfos.push(theGraveInfo);
        }
      }
      return (theGraveInfos);
    }
  }

  removeNiche(index: number): PBGrave {
    let theGrave : PBGrave = this.graves[index];
    this.graves[index] = null;
    return(theGrave);
  }

  setNiche(graveInfo: GraveInfo) {
    this.graves[graveInfo.theNiche.nicheIndex] = graveInfo.theGrave;
  }

}

export {PBRow, DEFAULT_NUM_NICHES};