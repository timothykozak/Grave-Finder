// PBAddGrave.ts
//
// Used for adding a grave.  Extends PBOcclusion.
// Gets data for cemetery names and grave/plot through events.

import {SerializableGrave, GraveState} from "./PBInterfaces.js";
import {PBOcclusion} from "./PBOcclusion.js";
import {PBConst} from "./PBConst.js";

class PBAddGrave extends PBOcclusion {
    name: string;   // Name of interred, or owner if not yet used
    dates: string;  // Birth and death dates.  Unused if not interred.
    state: GraveState;  // Use GraveState enum

    cemeteryElement: HTMLSelectElement;
    stateElement: HTMLSelectElement;
    nameElement: HTMLInputElement;
    datesElement: HTMLInputElement;
    plotElement: HTMLInputElement;
    graveElement: HTMLSelectElement;
    saveButton: HTMLButtonElement;
    exitButton: HTMLButtonElement;

    cemeteryNames: Array<string> = [];

    constructor(occludedDiv: HTMLDivElement) {
        super(occludedDiv, false);  // Generate the basic occlusion HTML without the text or the OK button
        this.initEventListeners();
    }

    activate(text: string) {
        let firstTime = !this.activated;
        super.activate();
        if (firstTime) {
            // This occlusion may be activated multiple times,
            // but only need to add the elements once.
            this.extraDiv.innerHTML = this.initAddElements();
            this.waitForElementsToBeInstantiated();
        }
    }

    waitForElementsToBeInstantiated() {
        // Can't get the elements until they have been instantiated.
        // Wait until the last one is instantiated.
        let buttonElement = document.getElementById('add-grave-exit');
        if (buttonElement)
            window.dispatchEvent(new Event(PBConst.EVENTS.requestCemeteryNames));
        else
            setTimeout(() => {this.waitForElementsToBeInstantiated();}, 100);
    }

    initAddElements(): string {
        // Add all of the elements to define the grave.
        let theHTML = ` <table>
                        <tr><td>Cemetery: </td><td><select id="add-grave-cemetery"></select></td></tr>
                        <tr><td>State: </td><td><select id="add-grave-state"></select></td></tr>
                        <tr><td>Name:  </td><td><input type="text" class="" id="add-grave-name"></td></tr>
                        <tr><td>Dates: </td><td><input type="text" class="" id="add-grave-dates"></td></tr>
                        <tr><td>Plot:  </td><td><input type="number" class="plot" min="1" max="165" style="width: 50px;" id="add-grave-plot" onchange="window.dispatchEvent(new Event('${PBConst.EVENTS.changePlotNumber}'))"> </input></td></tr>
                        <tr><td>Grave: </td><td><select style="width: 50px;" id="add-grave-grave" onchange="window.dispatchEvent(new Event('${PBConst.EVENTS.changeGraveNumber}'))"></select></td></tr>
                        </table>
                        <div class="button-div">
                            <button type="button" id="add-grave-save">Save</button>
                            <button type="button" id="add-grave-exit" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.closeAddGraveUI}'))">Exit</button>
                        </div>`;
        return(theHTML);
    }

    initEventListeners() {
        window.addEventListener(PBConst.EVENTS.cemeteryNamesResponse, (event: CustomEvent) => {this.onCemeteryNameResponse(event)});
    }

    getElements() {
        // Get all of the elements
        this.cemeteryElement = document.getElementById('add-grave-cemetery') as HTMLSelectElement;
        this.stateElement = document.getElementById('add-grave-state') as HTMLSelectElement;
        this.nameElement = document.getElementById('add-grave-name')as HTMLInputElement;
        this.datesElement = document.getElementById('add-grave-dates') as HTMLInputElement;
        this.plotElement = document.getElementById('add-grave-plot') as HTMLInputElement;
        this.graveElement = document.getElementById('add-grave-grave') as HTMLSelectElement;
        this.saveButton = document.getElementById('add-grave-save') as HTMLButtonElement;
        this.exitButton = document.getElementById('add-grave-exit') as HTMLButtonElement;
    }

    onCemeteryNameResponse(event: CustomEvent) {
        // Received the cemetery names.  Can prepare the UI
        // for the first grave to be added.
        this.cemeteryNames = event.detail.names.slice();
        this.prepareUI();
    }

    prepareCemeteryElement() {
        let selectOptions: string = '';
        this.cemeteryNames.forEach((name, index) => {
            selectOptions += '<option value="' + index + '">' + name + '</option>';} );
        this.cemeteryElement.innerHTML = selectOptions;
    }

    prepareStateElement() {
        this.stateElement.innerHTML = `<option value="0">Interred</option>
                                       <option value="1">Reserved</option>
                                       <option value="2">Unassigned</option>`;
    }

    prepareUI() {
        // Prepare the elements of the UI.
        this.getElements();
        this.prepareCemeteryElement();
        this.prepareStateElement();
        this.saveButton.onclick = this.addGrave;
    }

    addGrave() {

    }

}

export {PBAddGrave};