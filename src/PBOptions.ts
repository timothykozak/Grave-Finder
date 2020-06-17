// PBOptions.ts
//
// Used for setting the options.  Extends PBOcclusion.

import {PBOcclusion} from "./PBOcclusion.js";
import {PBConst} from "./PBConst.js";
import {AppOptions} from "./PBInterfaces.js";

class PBOptions extends PBOcclusion {

    boundaryElement: HTMLInputElement;
    plotsElement: HTMLInputElement;
    gravesElement: HTMLInputElement;
    interredElement: HTMLInputElement;
    reservedElement: HTMLInputElement;
    unavailableElement: HTMLInputElement;
    unassignedElement: HTMLInputElement;

    saveButton: HTMLButtonElement;
    exitButton: HTMLButtonElement;
    appOptions: AppOptions = {DrawBoundary: false, DrawPlots: false, ShowInterred: true, ShowReserved: false, ShowUnavailable: false, ShowUnassigned: false};

    constructor(occludedDiv: HTMLDivElement) {
        super(occludedDiv, false);  // Generate the basic occlusion HTML without the text or the OK button
        this.initEventListeners();
        this.dispatchEvent();   // Inform everyone of the current options.
    }

    activate(text: string) {
        let firstTime = !this.activated;
        super.activate();
        if (firstTime) {
            // This occlusion may be activated multiple times,
            // but only need to add the elements once.
            this.extraDiv.innerHTML = this.generateHTML();
            this.waitForElementsToBeInstantiated();
        }
    }

    waitForElementsToBeInstantiated() {
        // Can't get the elements until they have been instantiated.
        // Wait until the last one is instantiated.
        let buttonElement = document.getElementById('options-exit');
        if (buttonElement) {
            this.prepareUI();
        }
        else
            setTimeout(() => {this.waitForElementsToBeInstantiated();}, 100);
    }

    generateHTML(): string {
        // The HTML to define the elements.
        let theHTML = ` <table>
                            <tr><td><input type="checkbox" id="options-boundary">Cemetery Boundary</input></td></tr>
                            <tr><td><input type="checkbox" id="options-plots">Cemetery Plots</input></td></tr>
                            <tr><td><input type="checkbox" id="options-interred">Interred</input></td></tr>
                            <tr><td><input type="checkbox" id="options-reserved">Reserved</input></td></tr>
                            <tr><td><input type="checkbox" id="options-unavailable">Unavailable</input></td></tr>
                            <tr><td><input type="checkbox" id="options-unassigned">Unassigned</input></td></tr>
                        </table>
                        <div class="button-div">
                            <button type="button" id="options-exit" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.closeOptions}'))">Exit</button>
                        </div>`;
        return(theHTML);
    }

    initEventListeners() {
    }

    getElements() {
        // Get all of the elements
        this.boundaryElement = document.getElementById('options-boundary') as HTMLInputElement;
        this.plotsElement = document.getElementById('options-plots') as HTMLInputElement;
        this.interredElement = document.getElementById('options-interred') as HTMLInputElement;
        this.reservedElement = document.getElementById('options-reserved') as HTMLInputElement;
        this.unavailableElement = document.getElementById('options-unavailable') as HTMLInputElement;
        this.unassignedElement = document.getElementById('options-unassigned') as HTMLInputElement;

        this.saveButton = document.getElementById('options-save') as HTMLButtonElement;
        this.exitButton = document.getElementById('options-exit') as HTMLButtonElement;
    }

    initOnInput(){
        // Set the
        this.boundaryElement.oninput = (event) => this.onInput(event);
        this.plotsElement.oninput = (event) => this.onInput(event);
        this.interredElement.oninput = (event) => this.onInput(event);
        this.reservedElement.oninput = (event) => this.onInput(event);
        this.unavailableElement.oninput = (event) => this.onInput(event);
        this.unassignedElement.oninput = (event) => this.onInput(event);
    }

    initOptions() {
        this.boundaryElement.checked = this.appOptions.DrawBoundary;
        this.plotsElement.checked = this.appOptions.DrawPlots;
        this.interredElement.checked = this.appOptions.ShowInterred;
        this.reservedElement.checked = this.appOptions.ShowReserved;
        this.unavailableElement.checked = this.appOptions.ShowUnavailable;
        this.unassignedElement.checked = this.appOptions.ShowUnassigned;
    }

    prepareUI() {
        this.getElements();
        this.initOnInput();
        this.initOptions();
    }

    getOptions() {
        this.appOptions.DrawBoundary = this.boundaryElement.checked;
        this.appOptions.DrawPlots = this.plotsElement.checked;
        this.appOptions.ShowInterred = this.interredElement.checked;
        this.appOptions.ShowReserved = this.reservedElement.checked;
        this.appOptions.ShowUnavailable = this.unavailableElement.checked;
        this.appOptions.ShowUnassigned = this.unassignedElement.checked;
    }

    dispatchEvent() {
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.optionsChanged, {detail: this.appOptions}))
    }

    onInput(event: Event) {
        this.getOptions();
        this.dispatchEvent();
    }
}

export {PBOptions};