// PBColumbarium.ts
//
// This class describes a columbarium that is located on a plot.
// Even if a plot contains multiple columbaria it is still treated
// as one columbarium with multiple faces.
// Each face has multiple rows.  Each row has multiple niches.
// A niche can have one or two urns.

import {PBGrave} from './PBGrave.js';
import {GraveInfo, GraveState, SerializableFace, SerializableColumbarium} from './PBInterfaces.js';
import {PBConst} from "./PBConst.js";
import {PBFace} from "./PBFace.js";

const DEFAULT_NUMFACES = 4;

class PBColumbarium implements SerializableColumbarium {
  //
  numFaces: number;
  faces: Array<PBFace>;

  constructor(theSC: SerializableColumbarium) {
    this.deSerialize(theSC);
  }

  deSerialize(theSC: SerializableColumbarium) {
    theSC = !(theSC == null) ? theSC : {numFaces: DEFAULT_NUMFACES, faces: null}
    this.numFaces = !(theSC.numFaces == null) ? theSC.numFaces : DEFAULT_NUMFACES;
    this.faces = new Array<PBFace>();

    for (let index: number = 0; index < this.numFaces; index++) {
      if (theSC.faces && theSC.faces[index]) {
        this.faces.push(new PBFace(theSC.faces[index]));
      } else {
        this.faces.push(new PBFace(null));
      }
    }
  }

  serialize(): string {
    let theJSON = '\n      {';  // Start the columbarium object.
    theJSON += '"numFaces":' + JSON.stringify(this.numFaces) + ', ';

    theJSON += '\n        "faces": [ ';    // Open up the faces array.
    this.faces.forEach((theFace: PBFace, index: number) => {
      theJSON += theFace.serialize();
      theJSON += (index == (this.faces.length - 1)) ? '' : ',';
    })
    theJSON += ']';   // Finish up the faces array.

    theJSON += '}'; // Finish the columbarium object.
    return(theJSON);
  }

}

export {PBColumbarium};