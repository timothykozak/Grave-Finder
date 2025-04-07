// PBAddGrave.ts
//
// Used for adding a grave.  Extends PBOcclusion.
// Gets data for cemetery names and grave/plot through events.

import {SerializableGrave, GraveState, NicheInfo, GraveInfo, RequestChangeGraveHTML} from "./PBInterfaces.js";
import {PBOcclusion} from "./PBOcclusion.js";
import {PBConst} from "./PBConst.js";
import {PBGrave} from "./PBGrave.js";

class PBAddGrave extends PBOcclusion {
    firstTime: boolean = true;
    name: string;   // Name of interred, or owner if not yet used
    dates: string;  // Birth and death dates.  Unused if not interred.
    state: GraveState;  // Use GraveState enum

    cemeteryElement: HTMLSelectElement;
    stateElement: HTMLSelectElement;
    nameElement: HTMLInputElement;
    datesElement: HTMLInputElement;
    plotElement: HTMLInputElement;
    faceElement: HTMLSelectElement; // Only for columbarium
    graveElement: HTMLSelectElement;
    saveButton: HTMLButtonElement;
    exitButton: HTMLButtonElement;

    cemeteryNames: Array<string> = [];

    constructor(occludedDiv: HTMLDivElement) {
        super(occludedDiv, false);  // Generate the basic occlusion HTML without the text or the OK button
        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener(PBConst.EVENTS.cemeteryNamesResponse, (event: CustomEvent) => {this.onCemeteryNameResponse(event)});
    }

    myCreateElement(isInput: boolean, theType: string, theClass: string): HTMLElement {
        // Can't just create an element with the new operator.
        let theElement;
        if (isInput) {  // Used for text and number spinners
            theElement = document.createElement('input');
            theElement.type = theType;
        } else {    // Used for selectors
            theElement = document.createElement(theType);
        }
        theElement.className = theClass;
        return(theElement);
    }

    createEditElements() {
        // Create all of the elements for the row edit.  These elements are created
        // once and recycled for new edits.
        this.cemeteryElement = this.myCreateElement(false, 'select', 'add-grave-cemetery') as HTMLSelectElement;
        this.stateElement = this.myCreateElement(false, 'select', 'add-grave-state') as HTMLSelectElement;
        this.nameElement = this.myCreateElement(true, 'text', 'add-grave-name') as HTMLInputElement;
        this.datesElement = this.myCreateElement(true, 'text', 'add-grave-dates') as HTMLInputElement;
        this.plotElement = this.myCreateElement(true, 'number', 'add-grave-plot') as  HTMLInputElement;
        this.faceElement = this.myCreateElement(false, 'select', 'add-grave-face') as  HTMLSelectElement;
        this.graveElement = this.myCreateElement(false, 'select', 'add-grave-grave') as  HTMLSelectElement;
    }

    generateTableHTML(): string {
        // This table needs to be populated with the input and select elements
        let theHTML = ` <table>
                        <tr><td>Cemetery: </td><td id="cemetery-td"></td></tr>
                        <tr><td>State: </td><td id="state-td"></td></tr>
                        <tr><td>Name:  </td><td id="name-td"></td></tr>
                        <tr><td>Dates: </td><td id="dates-td"></td></tr>
                        <tr><td>Plot:  </td><td id="plot-td"></td></tr>
                        <tr><td>Face: </td><td id="face-td"></td></tr>
                        <tr><td>Grave: </td><td id="grave-td"></td></tr>
                        </table>
                        <div class="button-div">
                            <button type="button" id="add-grave-save" onclick="((event) => {this.onAddGraveClick(event)})()">Add Grave</button>
                            <button type="button" id="add-grave-exit" onclick="((event) => {this.onExitClick(event)})()">Exit</button>
                        </div>`;
        return(theHTML);
    }

    appendElements() {
        // Get all of the elements
        document.getElementById('cemetery-td').appendChild(this.cemeteryElement);
        document.getElementById('state-td').appendChild(this.stateElement);
        document.getElementById('plot-td').appendChild(this.plotElement);
        document.getElementById('name-td').appendChild(this.nameElement);
        document.getElementById('dates-td').appendChild(this.datesElement);
        document.getElementById('face-td').appendChild(this.faceElement);
        document.getElementById('grave-td').appendChild(this.graveElement);
    }

    setOnChangeAndOnClick(){
        this.cemeteryElement.onchange = (event) => {this.onCemeteryChange(event);};
        this.plotElement.onchange = (event) => {this.onPlotChange(event);};
        this.faceElement.onchange = (event) => {this.onFaceChange(event);};
        document.getElementById('add-grave-save').onclick = (event) => {this.onAddGraveClick(event);};
        document.getElementById('add-grave-exit').onclick = (event) => {this.onExitClick(event);};
    }

    activate(text: string) {
        // This overrides the activate method of PBOcclusion
        super.activate();
        if (this.firstTime) {   // Can be activated multiple times, but only need to generate
                                // the table HTML and the elements once.
            this.createEditElements();
            this.extraDiv.innerHTML = this.generateTableHTML();
            this.appendElements();
            this.setOnChangeAndOnClick();
            window.dispatchEvent(new Event(PBConst.EVENTS.requestCemeteryNames));
        }
        this.firstTime = false;
        this.initGrave();
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

    onCemeteryNameResponse(event: CustomEvent) {
        // Received the cemetery names.  Can prepare the UI
        // for the first grave to be added.
        this.cemeteryNames = event.detail.names.slice();
        this.prepareCemeteryElement();
        this.prepareStateElement();
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
        // NOTE: Although an event is dispatched
        let detailObject: RequestChangeGraveHTML = {calledByAddGrave: true, cemeteryIndex: this.cemeteryElement.selectedIndex,
                            plotIndex: parseInt((this.plotElement as HTMLInputElement).value, 10) - 1,
            // graveIndex: (thePlotIndex == theGraveInfo.plotIndex) ? theGraveInfo.graveIndex : PBConst.INVALID_PLOT,
                            graveIndex: this.graveElement.selectedIndex,
                            graveElement: this.graveElement,
                            plotElement: this.plotElement,
                            faceIndex: this.faceElement.selectedIndex,
                            faceElement: this.faceElement
                            };
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.requestChangeGraveHTML, {detail: detailObject}))
    }

    onPlotChange(event: Event) {
        this.graveElement.selectedIndex = PBConst.INVALID_PLOT;
        this.requestChangeGraveHTML();
    }

    onFaceChange(event: Event) {
        this.graveElement.selectedIndex = PBConst.INVALID_PLOT;
        this.requestChangeGraveHTML();
    }

    onAddGraveClick(event: Event) {
        // Add the grave to the cemetery
        let theState = this.stateElement.selectedIndex;
        let theGraveIndex: number = this.graveElement.selectedIndex;
        let theGraveInfo: GraveInfo = {
                    cemeteryIndex: this.cemeteryElement.selectedIndex,
                    graveIndex: theGraveIndex,
                    plotIndex: parseInt(this.plotElement.value, 10) - 1,
                    theGrave: new PBGrave({ name: PBGrave.getNameByState(this.nameElement.value, theState),
                                            dates: PBGrave.getDatesByState(this.datesElement.value, theState),
                                            state: theState} as SerializableGrave)
        };
        if (!this.faceElement.hidden) { // The graveElement shows all of the columbarium rows and
                                        // niches together.  The for the selected index equals
                                        // rowIndex * 10 + nicheIndex
            let theGraveValue: number = parseInt(this.graveElement.value, 10);
            theGraveInfo.theNiche = { faceIndex: this.faceElement.selectedIndex,
                                      rowIndex: Math.round(theGraveValue / 10),
                                      nicheIndex: (theGraveValue % 10)
            } as NicheInfo;
        }
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.addGrave, {detail: theGraveInfo}));
        this.initGrave();
    }

    onExitClick(event: Event) {
        this.deactivate();
    }
}

export {PBAddGrave};