// PBPlot.ts
//
// This class describes a section of a cemetery
// with one or more places for a grave.

import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {LatLngLit, SerializablePlot} from './PBInterfaces';
import {PBConst} from './PBConst.js';

const DEFAULT_ID = -1;
const DEFAULT_ANGLE = 0.0;
const DEFAULT_LATLNGLIT = {lat: 0, lng: 0};
const DEFAULT_NUM_GRAVES = 6;

class PBPlot implements SerializablePlot {
    id: number;
    location: LatLngLit;
    angle: number;
    numGraves: number;

    constructor(public map: google.maps.Map, theSP: SerializablePlot) {
        this.deSerialize(theSP);
    }


    deSerialize(theSP: SerializablePlot) {
        this.id = !(theSP.id == null) ? theSP.id : DEFAULT_ID;
        this.location = !(theSP.location == null) ? theSP.location : DEFAULT_LATLNGLIT;
        this.angle = !(theSP.angle == null)  ? theSP.angle : DEFAULT_ANGLE;
        this.numGraves = !(theSP.numGraves == null)  ? theSP.numGraves : DEFAULT_NUM_GRAVES;
    }

    serialize(): string {
        let theJSON = '\n      {';
        theJSON += '"id":' + JSON.stringify(this.id) + ', ';
        theJSON += '"location":' + JSON.stringify(this.location) + ', ';
        theJSON += '"angle":' + JSON.stringify(this.angle) + ', ';
        theJSON += '"numGraves":' + JSON.stringify(this.numGraves);
        theJSON += '}';
        return(theJSON);
    }
}

export {PBPlot};