// PBUI.ts
//
//  This class is the user interface to the app.
//  Currently it only supports the importing of grave data to a cemetery.

import {SerializableGrave} from './PBInterfaces.js';
import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {PBConst} from './PBConst.js';
import {PBGraveSearch} from "./PBGraveSearch.js";

class PBUI {
    controlDiv: HTMLDivElement;
    editDiv: HTMLDivElement;
    selectElement: HTMLSelectElement;
    textElement: HTMLTextAreaElement;
    savingElement: HTMLDivElement;
    graveSearch: PBGraveSearch;
    observer: MutationObserver;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.graveSearch = new PBGraveSearch(map, cemeteries);
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.controlDiv = document.createElement('div') as HTMLDivElement;
        this.initObserver();
        this.controlDiv.innerHTML = this.buildUIHTML();
        this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.controlDiv);
    }

    initEventListeners() {
        window.addEventListener(PBConst.EVENTS.postJSON, () => {this.onSaveInitiated();});
        window.addEventListener(PBConst.EVENTS.postJSONResponse, (event: CustomEvent) => {this.onSaveFinished(event);});
        window.addEventListener(PBConst.EVENTS.importGraves, (event: CustomEvent) => {this.onImportGraves();});
    }

    buildUIHTML(): string {
        let theHTML = '<div id="bounding-div" class="bounding-div">';
        theHTML += `<select id="cemetery-select">${this.buildSelectListHTML()}</select>`;
        theHTML += this.graveSearch.buildTableHTML();
        theHTML += `<div id="edit-div" class="edit-div">
                        <textarea id="import-text"></textarea>
                        <div id="saving-div"></div>
                        <button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.importGraves}'));">Import Graves</button>            <div id="savingdiv"></div>
                        <button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.postJSON}));">Save JSON</button>
                    </div>`;
        theHTML += '</div>';
        return(theHTML);
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
        this.savingElement.innerText = 'Saving, please wait.'
    }

    onSaveFinished(event: CustomEvent) {
        let status = 'Save successful.';
        if (!event.detail.success) {
            status = 'Save failed: ' + event.detail.message;
        }
        this.savingElement.innerText = status;
    }

    onObserver(mutationList: Array<MutationRecord>, theObserver: MutationObserver) {
        // Although the elements have been added, still need to wait before
        // we can access them by getElementById.
        setTimeout(() => {
            this.getElements();
            this.graveSearch.initElements();
            this.graveSearch.populateTable();
        }, 1000);
    }

    initObserver(){
        this.observer = new MutationObserver((mutationList: Array<MutationRecord>, theObserver: MutationObserver) => {this.onObserver(mutationList, theObserver);});
        this.observer.observe(this.controlDiv, {childList: true, subtree: true})
    }

    getElements() {
        // Cannot get the elements until that have been appended to the document.
        // Not sure when that happens.
        this.selectElement = document.getElementById('cemetery-select') as HTMLSelectElement;
        this.textElement = document.getElementById('import-text') as HTMLTextAreaElement;
        this.savingElement = document.getElementById('saving-div') as HTMLDivElement;
        this.editDiv = document.getElementById('edit-div') as HTMLDivElement;
    }

    onImportGraves() {
        // Only supports a very simple import of
        // name and date pairs.
        // The first line of the pair is a \n terminated string with the full name.
        // The second line is a \n terminated string with some type of date.
        // The date is only stored as a string and is not validated in any way.
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