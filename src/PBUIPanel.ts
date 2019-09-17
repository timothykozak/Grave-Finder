// PBUIPanel.ts
//
//  This class is the user interface to the app.
//  Currently it only supports the importing of grave data to a cemetery.

import {SerializableGrave} from "./PBInterfaces.js";
import {PBGrave} from "./PBGrave.js";
import {PBCemetery} from "./PBCemetery.js";
import {PBConst} from "./PBConst.js";

class PBUIPanel {
    uiPanel: HTMLDivElement;
    selectElement: HTMLSelectElement;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uiPanel = document.getElementById("uipanel") as HTMLDivElement;
        this.uiPanel.innerHTML = this.buildUIPanelHTML();
        this.selectElement = document.getElementById("cemeteryselect") as HTMLSelectElement;
        this.selectElement.selectedIndex = 0;
    }

    initEventListeners() {
        window.addEventListener(PBConst.EVENTS.postJSON, () => {this.onSaveInitiated();})
        window.addEventListener(PBConst.EVENTS.postJSONResponse, (event: CustomEvent) => {this.onSaveFinished(event);})
        window.addEventListener(PBConst.EVENTS.importGraves, (event: CustomEvent) => {this.onImportGraves();})
    }

    buildUIPanelHTML(): string {
        return(`<button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.importGraves}'));">Import Graves</button>
                <select id="cemeteryselect">${this.buildSelectListHTML()}</select>
                <textarea id="importtext"></textarea>
                <button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.postJSON}'));">Save JSON</button>`);
    }

    buildSelectListHTML() {
        let selectOptions: string = '';
        for (let index = 0; index < this.cemeteries.length; index++) {
            let cemeteryName = this.cemeteries[index].title.split('\n')[0];
            selectOptions += `<option value="${index}">${cemeteryName}</option>`;
        }
        return(selectOptions);
    }

    onSaveInitiated() {

    }

    onSaveFinished(event: CustomEvent) {

    }

    onImportGraves() {
        // Only supports a very simple import of
        // name and date pairs.
        // The first line of the pair is a \n terminated string with the full name.
        // The second line is a \n terminated string with some type of date.
        // The date is only stored as a string and is not validated in any way.
        let theCemetery: PBCemetery = this.cemeteries[this.selectElement.selectedIndex];
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