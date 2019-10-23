// PBAddGrave.ts
//
// Used for adding a grave.  Extends PBOcclusion.

import {SerializableGrave, GraveState} from "./PBInterfaces.js";
import {PBOcclusion} from "./PBOcclusion.js";

class PBAddGrave extends PBOcclusion implements SerializableGrave {
    name: string;   // Name of interred, or owner if not yet used
    dates: string;  // Birth and death dates.  Unused if not interred.
    state: GraveState;  // Use GraveState enum

    constructor(occludedDiv: HTMLDivElement) {
        super(occludedDiv);
    }


}

export {PBAddGrave};