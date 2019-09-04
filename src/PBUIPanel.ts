// PBUIPanel.ts
//
//

import {LatLngLit, SerializableGrave} from "./PBInterfaces.js";

class PBUIPanel {
    uiPanel: HTMLDivElement;

    constructor(public map: google.maps.Map) {
        this.uiPanel = document.getElementById("uipanel") as HTMLDivElement;
    }

}

export {PBUIPanel};