// PBInterfaces.ts
//

import {PBGrave} from "./PBGrave.js";
import {PBCemetery} from "./PBCemetery.js";
import {PBPlot} from "./PBPlot.js";

type LatLngLit = google.maps.LatLngLiteral;

interface SerializableGrave {   // See PBGrave for descriptions of these properties.
    name: string,
    dates: string,
    width: number,
    length: number
}

interface GraveInfo {
    cemeteryIndex: number,
    plotIndex: number,
    graveIndex: number,
    theGrave: PBGrave
}

interface SerializablePlot {    // See PBPlot for descriptions of these properties.
    id: number;
    northFeet: number,
    eastFeet: number,
    angle: number,
    numGraves: number,
    graves: Array<PBGrave>
}

interface SerializableCemetery {    // See PBCemetery for descriptions of these properties.
    location: LatLngLit,
    name: string,
    town: string,
    description: string,
    boundaries: Array<LatLngLit>,
    zoom: number,
    angle: number,

    graves: Array<PBGrave>,
    plots: Array<PBPlot>
}

interface SerializableGraveFinder { // See PBGraveFinder for descriptions of these properties.
    initialLatLng: google.maps.LatLng;
    cemeteries: Array<PBCemetery>;
}

export {LatLngLit, SerializableGrave, SerializableCemetery,
    SerializableGraveFinder, SerializablePlot, GraveInfo}