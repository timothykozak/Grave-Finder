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
    this.graves = new Array<PBGrave>();
    this.urns = new Array();

    for (let index: number = 0; index < this.numNiches; index++) {
      if (theSR.graves && theSR.graves[index]) { // The grave exists
        this.graves.push(new PBGrave(theSR.graves[index]));
      } else {  // Create default grave
        this.graves.push(new PBGrave({name: "", dates: "", state: GraveState.Unassigned}));
      }
      if (theSR.urns && theSR.urns[index]) { // The urn exists
        this.urns[index] = theSR.urns[index];
      } else {  // Create default urn
        this.urns[index] = DEFAULT_URNS;
      }
    }
  }

  serialize(padding: string): string {
    let theJSON: string = padding + ' { ';  // Start the row object.
    theJSON += '"name": ' + JSON.stringify(this.name) + ', ';
    theJSON += '"numNiches": ' + JSON.stringify(this.numNiches) + ', ';

    theJSON += '\n' + padding + '   "graves": [';  // Start graves array
    this.graves.forEach((theGrave: PBGrave, index: number) => {
      theJSON += theGrave.serialize(padding + '     ');
      theJSON += (index < (this.numNiches - 1)) ? ',' : ''; // No comma on the last grave
    });
    theJSON += '],'; // Finish graves array

    theJSON += '\n' + padding + '   "urns": [';  // Start urns array
    this.urns.forEach((theUrn: number, index: number) => {
      theJSON += JSON.stringify(theUrn);
      theJSON += (index < (this.numNiches - 1)) ? ', ' : ''; // No comma on the last urn
    });
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
      this.graves.forEach((thisGrave, index) => {
        let theGraveInfo: GraveInfo = {cemeteryIndex: baseGraveInfo.cemeteryIndex, plotIndex: baseGraveInfo.plotIndex,
                                        graveIndex: baseGraveInfo.graveIndex, theGrave: thisGrave};
        theGraveInfo.theNiche = {faceIndex: baseNicheInfo.faceIndex, rowIndex: baseNicheInfo.rowIndex,
                                        nicheIndex: index, faceName: baseNicheInfo.faceName, rowName: this.name,
                                        urns: this.urns[index]};
        theGraveInfos.push(theGraveInfo);
      });
    }
    return(theGraveInfos);
  }

  deleteGrave(theGraveInfo: GraveInfo) {
    // Actually just initializes theGrave.
    if (theGraveInfo && theGraveInfo.theNiche && (theGraveInfo.theNiche.nicheIndex < this.numNiches)) {
      this.graves[theGraveInfo.theNiche.nicheIndex] = new PBGrave({name: "", dates: "", state: GraveState.Unassigned});
    }
  }

}

export {PBRow};