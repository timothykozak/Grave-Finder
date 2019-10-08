// PBGrave.ts
//
//

import {SerializableGrave} from "./PBInterfaces.js";
import {PBConst} from "./PBConst.js";

const DEFAULT_WIDTH: number = 4;
const DEFAULT_LENGTH: number = 12;

class PBGrave implements SerializableGrave {
    name: string;   // Name of interred, or owner if not yet used
    dates: string;  // Birth and death dates
    width: number;
    length: number;
    validGrave: boolean;

    constructor(public map: google.maps.Map, theSG: SerializableGrave) {
        this.deSerialize(theSG);
    }

    deSerialize(theSG: SerializableGrave) {
        this.validGrave = true;
        this.name = !(theSG.name == null)  ? theSG.name : '';
        this.dates = !(theSG.dates == null)  ? theSG.dates : '';
        this.width = !(theSG.width == null) ? theSG.width : PBConst.GRAVE.width;
        this.length = !(theSG.length == null) ? theSG.length : PBConst.GRAVE.length;
        if ((this.name.length + this.dates.length) == 0)
            this.validGrave = false;
    }

    serialize(padding: string): string {
        let theJSON = '\n' + padding + '{';
        theJSON += '"name":' + JSON.stringify(this.name) + ', ';
        theJSON += '"dates":' + JSON.stringify(this.dates) + ', ';
        theJSON += '"width":' + JSON.stringify(this.width) + ', ';
        theJSON += '"length":' + JSON.stringify(this.length);
        theJSON += '}';
        return(theJSON);
    }

    textMatch(theText: string): boolean {
        theText.toLowerCase();
        let totalTextToSearch: string = this.name + this.dates;
        return(totalTextToSearch.toLowerCase().includes(theText));
    }

}

export {PBGrave, SerializableGrave};