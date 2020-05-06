// PBAddGrave.ts
//
// Used for adding a grave.  Extends PBOcclusion.
// Gets data for cemetery names and grave/plot through events.

import {SerializableGrave, GraveState, GraveInfo, RequestChangeGraveHTML} from "./PBInterfaces.js";
import {PBOcclusion} from "./PBOcclusion.js";
import {PBConst} from "./PBConst.js";
import {PBGrave} from "./PBGrave.js";

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
        } else {
            this.initGrave();
        }
    }

    waitForElementsToBeInstantiated() {
        // Can't get the elements until they have been instantiated.
        // Wait until the last one is instantiated.
        let buttonElement = document.getElementById('add-grave-exit');
        if (buttonElement) {
            window.dispatchEvent(new Event(PBConst.EVENTS.requestCemeteryNames));
        }
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
                        <tr><td>Plot:  </td><td><input type="number" class="plot" min="1" max="165" style="width: 50px;" id="add-grave-plot"> </input></td></tr>
                        <tr><td>Grave: </td><td><select style="width: 50px;" id="add-grave-grave"></select></td></tr>
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

    setOnChangeOnClick(){
        this.cemeteryElement.onchange = (event) => {this.onCemeteryChange(event);};
        this.plotElement.onchange = (event) => {this.onPlotChange(event);};
        this.saveButton.onclick = (event) => {this.onSaveClick(event);};
        this.exitButton.onclick = (event) => {this.onExitClick(event);};
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
                                       <option value="1">Unavailable</option>
                                       <option value="2">Unassigned</option>`;
    }

    prepareUI() {
        // Prepare the elements of the UI.
        this.getElements();
        this.setOnChangeOnClick();
        this.prepareCemeteryElement();
        this.prepareStateElement();
        this.initGrave();
    }

    onCemeteryNameResponse(event: CustomEvent) {
        // Received the cemetery names.  Can prepare the UI
        // for the first grave to be added.
        this.cemeteryNames = event.detail.names.slice();
        this.prepareUI();
    }

    initGrave() {
        // Brand new grave.
        this.cemeteryElement.selectedIndex = 0;
        this.stateElement.selectedIndex = 0;
        this.nameElement.value = '';
        this.datesElement.value = '';
        this.initPlotGraveElements();
    }

    initPlotGraveElements() {
        // Set plot and grave to invalid.
        // Need to call requestChangeGraveHTML to initialize
        // the min and the max of plotElement based on cemetery.
        this.plotElement.value = '0';
        this.graveElement.selectedIndex = 0;
        this.requestChangeGraveHTML();
    }

    onCemeteryChange(event: Event) {
        this.initPlotGraveElements();
    }

    requestChangeGraveHTML() {
        // The plot number has changed.  Need to update the HTML for
        // the grave element and the min and max on the plot element.
        let detailObject: RequestChangeGraveHTML = {calledByAddGrave: true, cemeteryIndex: this.cemeteryElement.selectedIndex,
                            plotIndex: parseInt((this.plotElement as HTMLInputElement).value, 10) - 1,
            // graveIndex: (thePlotIndex == theGraveInfo.plotIndex) ? theGraveInfo.graveIndex : PBConst.INVALID_PLOT,
                            graveIndex: this.graveElement.selectedIndex,
                            graveElement: this.graveElement,
                            plotElement: this.plotElement  };
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.requestChangeGraveHTML, {detail: detailObject}))
    }

    onPlotChange(event: Event) {
        this.graveElement.selectedIndex = PBConst.INVALID_PLOT;
        this.requestChangeGraveHTML();
    }

    onSaveClick(event: Event) {
        let theGraveInfo: GraveInfo = {
            cemeteryIndex: this.cemeteryElement.selectedIndex,
            graveIndex: this.graveElement.selectedIndex,
            plotIndex: parseInt(this.plotElement.value, 10) - 1,
            theGrave: new PBGrave({ name: this.nameElement.value,
                                    dates: this.datesElement.value,
                                    state: this.stateElement.selectedIndex} as SerializableGrave)
        };
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.addGrave, {detail: theGraveInfo}));
        this.initGrave();
    }

    onExitClick(event: Event) {
        this.deactivate();
    }
}

export {PBAddGrave};