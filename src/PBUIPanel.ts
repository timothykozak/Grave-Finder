// PBUIPanel.ts
//
//

import {LatLngLit, SerializableGrave} from "./PBInterfaces.js";
import {PBGrave} from "./PBGrave.js";
import {PBCemetery} from "./PBCemetery.js";

class PBUIPanel {
    uiPanel: HTMLDivElement;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.uiPanel = document.getElementById("uipanel") as HTMLDivElement;
        this.uiPanel.innerHTML = PBUIPanel.buildUIPanelHTML();
    }

    static buildUIPanelHTML(): string {
        return(`<button type="button" onclick="window.PBGraveFinder.uiPanel.importGraves();">Import</button>
                <textarea id="importtext">`);
    }

    importGraves() {
        let theCemetery: PBCemetery = this.cemeteries[0];
        let textElement: HTMLInputElement= document.getElementById("importtext") as HTMLInputElement;
        let textToImport: string = textElement.value;
        textToImport += "\n";   // Just in case
        let textArray = textToImport.split("\n");

        for (let index = 0; index < textArray.length; index += 2) {
            let theGrave = new PBGrave(this.map, {offset: null, angle: 0, size: null, name: textArray[index], dates: textArray[index + 1]} as SerializableGrave);
            if (theGrave.validGrave)
                theCemetery.addGraves(theGrave);
        }
    }

}

export {PBUIPanel};