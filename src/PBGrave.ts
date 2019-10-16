// PBGrave.ts
//
//

import {SerializableGrave, GraveState} from "./PBInterfaces.js";

class PBGrave implements SerializableGrave {
    name: string;   // Name of interred, or owner if not yet used
    dates: string;  // Birth and death dates
    state: GraveState;  // Use PBConst.GRAVE_STATE
    validGrave: boolean;

    constructor(public map: google.maps.Map, theSG: SerializableGrave) {
        this.deSerialize(theSG);
    }

    deSerialize(theSG: SerializableGrave) {
        this.validGrave = true;
        this.name = !(theSG.name == null)  ? theSG.name : '';
        this.dates = !(theSG.dates == null)  ? theSG.dates : '';
        this.state = !(theSG.state == null) ? theSG.state : GraveState.Interred;
        if ((this.name.length + this.dates.length) == 0)
            this.validGrave = false;
    }

    serialize(padding: string): string {
        let theJSON = '\n' + padding + '{';
        theJSON += '"name":' + JSON.stringify(this.name) + ', ';
        theJSON += '"dates":' + JSON.stringify(this.dates) + ', ';
        theJSON += '"state":' + JSON.stringify(this.state);
        theJSON += '}';
        return(theJSON);
    }

    textMatch(theText: string): boolean {
        theText.toLowerCase();
        let totalTextToSearch: string = this.name + this.dates;
        return(totalTextToSearch.toLowerCase().includes(theText));
    }

}

export {PBGrave};