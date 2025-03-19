// PBInterfaces.ts
//

import {PBGrave} from "./PBGrave.js";
import {PBPlot} from "./PBPlot.js";
import {PBRow} from "./PBRow.js";
import {PBFace} from "./PBFace.js";
import {PBColumbarium} from "./PBColumarium.js"
import {PBCemetery} from "./PBCemetery.js";

type LatLngLit = google.maps.LatLngLiteral;

enum GraveState {
    Interred = 0,
    Reserved,
    Unavailable,
    Unassigned
}

interface SerializableGrave {   // See PBGrave for descriptions of these properties.
    name: string,
    dates: string,
    state: GraveState
}

interface NicheInfo {
    faceIndex: number,
    rowIndex: number,
    nicheIndex: number,
    faceName: string,
    rowName: string,
    urns: number
}

interface GraveInfo {
    cemeteryIndex: number,
    graveIndex: number,
    plotIndex: number,
    theGrave: PBGrave,
    theNiche?: NicheInfo
}

interface SerializablePlot {    // See PBPlot for descriptions of these properties.
    id: number;
    northFeet: number,
    eastFeet: number,
    angle: number,
    numGraves: number,
    graveWidth: number,
    graveHeight: number,
    graves: Array<PBGrave>
    columbarium?: PBColumbarium;
}

interface SerializableRow {    // See PBRow for descriptions of these properties.
    name: string;
    numNiches: number;
    graves: Array<PBGrave>;
    urns: Array<number>
}

interface SerializableFace {    // See PBFace for descriptions of these properties.
    columbariumName: string;
    faceName: string;
    shortName: string;
    numRows: number;
    rows: Array<PBRow>
}

interface SerializableColumbarium {    // See PBColumbarium for descriptions of these properties.
    numFaces: number,
    faces: Array<PBFace>
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
    ShowInterred: boolean;
    ShowReserved: boolean;
    ShowUnavailable: boolean;
    ShowUnassigned: boolean;
}

interface RequestChangeGraveHTML {
    calledByAddGrave: boolean;
    cemeteryIndex: number;
    plotIndex: number;
    graveIndex: number;
    graveElement: HTMLSelectElement;
    plotElement: HTMLInputElement;
}

export {LatLngLit, GraveState, SerializableGrave, SerializableCemetery,
        NicheInfo, SerializableRow, SerializableFace, SerializableColumbarium,
        SerializableGraveFinder, AppOptions, SerializablePlot, GraveInfo, RequestChangeGraveHTML}