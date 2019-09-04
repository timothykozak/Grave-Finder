// PBGrave.ts
//
//

import {LatLngLit, SerializableGrave} from "./PBInterfaces.js";

class PBGrave implements SerializableGrave {

    offset: LatLngLit;
    angle: number;
    size: LatLngLit;
    text: string;

    constructor(public map: google.maps.Map, theSG: SerializableGrave) {
        this.deSerialize(theSG);
    }

    deSerialize(theSG: SerializableGrave) {
        this.offset = theSG.offset;
        this.angle = theSG.angle;
        this.size = theSG.size;
        this.text = theSG.text;
    }

    serialize(): string {
        let theJSON = '';
        let localSG: SerializableGrave = { offset: null, angle: null, size: null, text: null};
        return(theJSON);
    }
}

export {PBGrave, SerializableGrave};