// PBUIPanel.ts
//
//  This class is the user interface to the app.
//  Currently it only supports the importing of grave data to a cemetery.

import {SerializableGrave} from './PBInterfaces.js';
import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {PBConst} from './PBConst.js';

class PBUI {
    controlDiv: HTMLDivElement;
    selectElement: HTMLSelectElement;
    textElement: HTMLTextAreaElement;
    savingElement: HTMLDivElement;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.controlDiv = document.createElement('div') as HTMLDivElement;
        this.controlDiv.innerHTML = this.buildUIPanelHTML();
        this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.controlDiv);
    }

    initEventListeners() {
        window.addEventListener(PBConst.EVENTS.postJSON, () => {this.onSaveInitiated();});
        window.addEventListener(PBConst.EVENTS.postJSONResponse, (event: CustomEvent) => {this.onSaveFinished(event);});
        window.addEventListener(PBConst.EVENTS.importGraves, (event: CustomEvent) => {this.onImportGraves();});
    }

    buildUIPanelHTML(): string {
        return(`<button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.importGraves}'));">Import Graves</button>
                <select id="cemeteryselect">${this.buildSelectListHTML()}</select>
                <textarea id="importtext"></textarea>
                <div id="savingdiv"></div>
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
        this.getElements();
        this.savingElement.innerText = 'Saving, please wait.'
    }

    onSaveFinished(event: CustomEvent) {
        let status = 'Save successful.';
        if (!event.detail.success) {
            status = 'Save failed: ' + event.detail.message;
        }
        this.savingElement.innerText = status;
    }

    getElements() {
        // Cannot get the elements until that have been appended to the document.
        // Not sure when that happens.
        this.selectElement = document.getElementById('cemeteryselect') as HTMLSelectElement;
        this.textElement = document.getElementById('importtext') as HTMLTextAreaElement;
        this.savingElement = document.getElementById('savingdiv') as HTMLDivElement;
    }

    onImportGraves() {
        // Only supports a very simple import of
        // name and date pairs.
        // The first line of the pair is a \n terminated string with the full name.
        // The second line is a \n terminated string with some type of date.
        // The date is only stored as a string and is not validated in any way.
        this.getElements();
        let theCemetery: PBCemetery = this.cemeteries[this.selectElement.selectedIndex];
        let textToImport: string = this.textElement.value;
        textToImport += '\n';   // Just in case
        let textArray = textToImport.split('\n');

        for (let index = 0; index < textArray.length; index += 2) {
            let theGrave = new PBGrave(this.map, {offset: null, angle: 0, size: null, name: textArray[index], dates: textArray[index + 1]} as SerializableGrave);
            if (theGrave.validGrave)
                theCemetery.addGraves(theGrave);
        }
    }

}

export {PBUI};