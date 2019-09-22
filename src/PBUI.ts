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
    controlDiv: HTMLDivElement;     // The main div of the control.  Passed to map.controls.

    occlusionDiv: HTMLDivElement;   // When saving JSON, this occludes the controlDiv
    extraDiv: HTMLDivElement;       // Sits on top of the occlusionDiv so the text and button aren't transparent
    savingDiv: HTMLDivElement;      // Status of saving JSON.
    savingButton: HTMLButtonElement;    // To cancel the saving JSON result.

    boundingDiv: HTMLDivElement;    // Child of controlDiv.  Actually holds everything.
    selectElement: HTMLSelectElement;   // Drop down list of cemetery names.
    searchElement: HTMLInputElement;

    editDiv: HTMLDivElement;        // Holds all of the edit controls.  Initially hidden.
    importElement: HTMLTextAreaElement;   // Used to input text to be imported

    graveSearch: PBGraveSearch;
    editing: boolean = false;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.graveSearch = new PBGraveSearch(map, cemeteries);
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.controlDiv = document.createElement('div') as HTMLDivElement;

        // For the saving JSON.  Starts hidden
        this.occlusionDiv = document.createElement('div') as HTMLDivElement;
        this.controlDiv.appendChild(this.occlusionDiv);
        this.occlusionDiv.className = 'occlusion-div';
        this.extraDiv = document.createElement('div');
        this.controlDiv.appendChild(this.extraDiv);
        this.extraDiv.className = 'extra-div';
        this.savingDiv = document.createElement('div') as HTMLDivElement;
        this.extraDiv.appendChild(this.savingDiv);
        this.savingDiv.className = 'saving-div';
        this.savingButton = document.createElement('button');
        this.extraDiv.appendChild(this.savingButton);
        this.savingButton.className = 'saving-button';
        this.savingButton.innerText = 'OK';

        this.boundingDiv = document.createElement('div') as HTMLDivElement;
        this.controlDiv.appendChild(this.boundingDiv);
        this.boundingDiv.className = 'bounding-div';

        this.selectElement = document.createElement('select');
        this.boundingDiv.appendChild(this.selectElement);
        this.selectElement.innerHTML = this.buildSelectListHTML();
        this.searchElement = document.createElement('input');
        this.boundingDiv.appendChild(this.searchElement);
        this.searchElement.type = 'text';
        // this.searchElement.oninput = this.graveSearch.onInput(event);
        this.boundingDiv.innerHTML += `  <button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.requestPassword}'));">Edit</button>`;

        this.boundingDiv.appendChild(this.graveSearch.tableElement);

        this.editDiv = document.createElement('div');
        this.boundingDiv.appendChild(this.editDiv);
        this.editDiv.className = 'edit-div';
        this.editDiv.innerHTML = `  <button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.importGraves}'));">Import Graves</button>
                                    <button type="button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.postJSON}'));">Save JSON</button>
                                    <button type="button" class="close-button" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.closeEditControls}'));">Close</button>`;
        this.importElement = document.createElement('textarea');
        this.editDiv.appendChild(this.importElement);

        this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.controlDiv);
    }

    initEventListeners() {
        window.addEventListener(PBConst.EVENTS.postJSON, () => {this.onSaveInitiated();});
        window.addEventListener(PBConst.EVENTS.postJSONResponse, (event: CustomEvent) => {this.onSaveFinished(event);});
        window.addEventListener(PBConst.EVENTS.importGraves, (event: CustomEvent) => {this.onImportGraves();});
        window.addEventListener(PBConst.EVENTS.requestPassword, (event: CustomEvent) => {this.onRequestPassword();});
        window.addEventListener(PBConst.EVENTS.closeEditControls, (event: CustomEvent) => {this.onCloseEditControls();});
        window.addEventListener('input', (event: InputEvent) => {this.graveSearch.onInput(event)});
    }

    onRequestPassword(){
        let password = prompt("Enter the password.");
        if (password == 'lunchlady') {
            this.editing = true;
            this.editDiv.style.display = 'block';
        } else {
            alert('Invalid password.  Access denied.');
        }
    }

    onCloseEditControls() {
        this.editDiv.style.display = 'none';    // Hide the edit controls.
    }

    buildSelectListHTML(): string {
        let selectOptions: string = '';
        this.cemeteries.forEach((cemetery, index) => {
            selectOptions += '<option value="' + index + '">' + cemetery.name + '</option>';} );
        return(selectOptions);
    }

    onSaveInitiated() {
        this.occlusionDiv.style.display = 'block';
        this.extraDiv.style.display = 'block';
        this.savingDiv.innerText = 'Saving, please wait.'
    }

    onSaveFinished(event: CustomEvent) {
        let status = 'Save Successful';
        if (!event.detail.success) {
            status = `Save Failed<div style="font-size: 16px;">${event.detail.message}</div>`;
        }
        this.savingDiv.innerHTML = status;
        this.savingButton.style.display = 'block';
        this.savingButton.onclick = () => {
            this.extraDiv.style.display = 'none';
            this.savingButton.style.display = 'none';
            this.savingDiv.innerText = '';
            this.occlusionDiv.style.display = 'none';
        };
    }

    onImportGraves() {
        // Only supports a very simple import of
        // name and date pairs.
        // The first line of the pair is a \n terminated string with the full name.
        // The second line is a \n terminated string with some type of date.
        // The date is only stored as a string and is not validated in any way.
        let theCemetery: PBCemetery = this.cemeteries[this.selectElement.selectedIndex];
        let textToImport: string = this.importElement.value;
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