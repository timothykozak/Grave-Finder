// PBInterfaces.ts
//

import {PBGrave} from "./PBGrave.js";
import {PBCemetery} from "./PBCemetery";

type LatLngLit = google.maps.LatLngLiteral;

interface SerializableGrave {
    offset: LatLngLit,  // Offset from primary landmark of cemetery
    angle: number,      // Angle from principal axis of cemetery
    size: LatLngLit,    // Size of the plot
    name: string,       // Name of interred
    dates: string       // Birth and death dates
}

interface SerializableCemetery {
    location: LatLngLit,            // Marker location
    title: string,                  // Shows up when hovering over the marker
    description: string,            // Shows up when hovering over the cemetery
    boundaries: Array<LatLngLit>,   // The actual points of the cemetery boundary
    zoom: number,                   // For zooming in
    angle: number,                  // Angle of principle axis of the cemetery
    graves: Array<PBGrave>
}


interface SerializableGraveFinder {
    initialLatLng: google.maps.LatLng;
    cemeteries: Array<PBCemetery>;
}

export {LatLngLit, SerializableGrave, SerializableCemetery, SerializableGraveFinder}