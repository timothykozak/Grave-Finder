// PBInterfaces.ts
//

import {PBGrave} from "./PBGrave.js";
import {PBCemetery} from "./PBCemetery.js";
import {PBPlot} from "./PBPlot.js";

type LatLngLit = google.maps.LatLngLiteral;

enum GraveState {
    Interred = 0,
    Reserved,
    Unassigned,
}

interface SerializableGrave {   // See PBGrave for descriptions of these properties.
    name: string,
    dates: string,
    state: GraveState
}

interface GraveInfo {
    cemeteryIndex: number,
    graveIndex: number, //
    plotIndex: number,
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
    cemeteryDescription: string,
    landmarkDescription: string,
    northDescription: string,
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

interface AppOptions { // See PBOptions for descriptions of these properties.
    DrawBoundary: boolean;
    DrawPlots: boolean;
    DrawGraves: boolean;
}

export {LatLngLit, GraveState, SerializableGrave, SerializableCemetery,
    SerializableGraveFinder, AppOptions, SerializablePlot, GraveInfo}