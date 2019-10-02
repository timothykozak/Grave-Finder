// PBInterfaces.ts
//

import {PBGrave} from "./PBGrave.js";
import {PBCemetery} from "./PBCemetery.js";
import {PBPlot} from "./PBPlot.js";

type LatLngLit = google.maps.LatLngLiteral;

interface SerializableGrave {
    offset: LatLngLit,  // Offset from primary landmark of cemetery
    angle: number,      // Angle from principal axis of cemetery
    size: LatLngLit,    // Size of the plot
    name: string,       // Name of interred
    dates: string       // Birth and death dates
}

interface GraveInfo {
    cemeteryIndex: number,
    plotIndex: number,
    graveIndex: number,
    theGrave: PBGrave
}

interface SerializablePlot {
    id: number;
    northFeet: number,
    eastFeet: number,
    angle: number,
    numGraves: number,
    graves: Array<PBGrave>
}

interface SerializableCemetery {
    location: LatLngLit,            // Location of the landmark from which all plots
                                    // are offset in feet along the principal axis and
                                    // its orthogonal.
    name: string,                   //
    town: string,
    description: string,            // Shows up when hovering over the cemetery
    boundaries: Array<LatLngLit>,   // The actual points of the cemetery boundary
    zoom: number,                   // For zooming in to this cemetery
    angle: number,                  // Angle of the principle axis of the cemetery,
                                    // in degrees clockwise from north
    graves: Array<PBGrave>,         // Graves that have not been assigned to a plot
    plots: Array<PBPlot>
}

interface SerializableGraveFinder {
    initialLatLng: google.maps.LatLng;
    cemeteries: Array<PBCemetery>;
}

export {LatLngLit, SerializableGrave, SerializableCemetery,
    SerializableGraveFinder, SerializablePlot, GraveInfo}