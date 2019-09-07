// PBGrave.ts
//
//

import {LatLngLit, SerializableGrave} from "./PBInterfaces.js";

const DEFAULT_OFFSET: LatLngLit = {lat: 0, lng: 0};
const DEFAULT_SIZE: LatLngLit = {lat: 0, lng: 0};

class PBGrave implements SerializableGrave {


    offset: LatLngLit;
    angle: number;
    size: LatLngLit;
    name: string;
    dates: string;
    validGrave: boolean;


    constructor(public map: google.maps.Map, theSG: SerializableGrave) {
        this.deSerialize(theSG);
    }

    deSerialize(theSG: SerializableGrave) {
        this.validGrave = true;
        this.offset = !(theSG.offset == null) ? theSG.offset : DEFAULT_OFFSET;
        this.angle = !(theSG.angle == null)  ? theSG.angle : 0;
        this.size = !(theSG.size == null)  ? theSG.size : DEFAULT_SIZE;
        this.name = !(theSG.name == null)  ? theSG.name : '';
        this.dates = !(theSG.dates == null)  ? theSG.dates : '';
        if ((this.name.length + this.dates.length) == 0)
            this.validGrave = false;
    }

    serialize(): string {
        let theJSON = JSON.stringify(this, ["offset", "angle", "size", "name", "dates"]);
        // theJSON =  theJSON.replace(/\\"/g, '"');    // Remove the escaping of the backslashes
        return(theJSON);
    }
}

export {PBGrave, SerializableGrave};