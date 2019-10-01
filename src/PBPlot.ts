// PBPlot.ts
//
// This class describes a section of a cemetery
// with one or more places for a grave.

import {PBGrave} from './PBGrave.js';
import {GraveInfo, LatLngLit, SerializablePlot} from './PBInterfaces';

const DEFAULT_ID = -1;
const DEFAULT_ANGLE = 0.0;
const DEFAULT_LATLNGLIT = {lat: 0, lng: 0};
const DEFAULT_NUM_GRAVES = 6;

class PBPlot implements SerializablePlot {
    id: number;
    location: LatLngLit;
    angle: number;
    numGraves: number;
    graves: Array<PBGrave>; // This is probably a sparse array.  Need to de/serialize
                            // the undefined graves.

    constructor(public map: google.maps.Map, theSP: SerializablePlot) {
        this.deSerialize(theSP);
    }

    deSerialize(theSP: SerializablePlot) {
        this.id = !(theSP.id == null) ? theSP.id : DEFAULT_ID;
        this.location = !(theSP.location == null) ? theSP.location : DEFAULT_LATLNGLIT;
        this.angle = !(theSP.angle == null)  ? theSP.angle : DEFAULT_ANGLE;
        this.numGraves = !(theSP.numGraves == null)  ? theSP.numGraves : DEFAULT_NUM_GRAVES;

        this.graves = new Array(this.numGraves);
        theSP.graves.forEach((theGrave, index) => {
            if (theGrave.hasOwnProperty('name')) {
                this.graves[index] = new PBGrave(this.map, theSP.graves[index]);
            }
        });
    }

    serialize(): string {
        let theJSON = '\n      {';  // Start the plot object.
        theJSON += '"id":' + JSON.stringify(this.id) + ', ';
        theJSON += '"location":' + JSON.stringify(this.location) + ', ';
        theJSON += '"angle":' + JSON.stringify(this.angle) + ', ';
        theJSON += '"numGraves":' + JSON.stringify(this.numGraves) + ',';


        theJSON += '\n        "graves":[';    // Open up the grave array.
        for (let index = 0; index < this.numGraves; index++) {
            // JSON does not support undefined, so the undefined items
            // in the array are passed as empty objects, and the valid
            // graves are passed as is.
            let theGrave = this.graves[index];
            if (theGrave) {
                theJSON += '    ';
                theJSON += theGrave.serialize('          ');
            } else{
                theJSON += '\n          {}';
            }
            theJSON += (index == (this.graves.length - 1)) ? '' : ',';  // No comma on the last of the array
        }
        theJSON += ']';   // Finish up the grave array.

        theJSON += '}'; // Finish the plot object.
        return(theJSON);
    }

    getGraveInfo(cemeteryIndex: number): Array<GraveInfo> {
        let theGraveInfos: Array<GraveInfo> = [];
        return(theGraveInfos);
    }
}

export {PBPlot};