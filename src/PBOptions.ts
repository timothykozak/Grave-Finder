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

    saveButton: HTMLButtonElement;
    exitButton: HTMLButtonElement;
    appOptions: AppOptions = {DrawBoundary: false, DrawGraves: false, DrawPlots: false};

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
        let buttonElement = document.getElementById('options-exit');
        if (buttonElement) {
            this.prepareUI();
        }
        else
            setTimeout(() => {this.waitForElementsToBeInstantiated();}, 100);
    }

    initAddElements(): string {
        // Add all of the elements to define the grave.
        let theHTML = ` <table>
                            <tr><td><input type="checkbox" id="options-boundary">Boundary</input></td></tr>
                            <tr><td><input type="checkbox" id="options-plots">Plots</input></td></tr>
                            <tr><td><input type="checkbox" id="options-graves">Graves</input></td></tr>
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
        this.gravesElement = document.getElementById('options-graves') as HTMLInputElement;

        this.saveButton = document.getElementById('options-save') as HTMLButtonElement;
        this.exitButton = document.getElementById('options-exit') as HTMLButtonElement;
    }

    initOptions() {
        this.boundaryElement.checked = this.appOptions.DrawBoundary;
        this.plotsElement.checked = this.appOptions.DrawPlots;
        this.gravesElement.checked = this.appOptions.DrawGraves;
    }

    prepareUI() {
        this.getElements();
        this.initEventListeners();
        this.initOptions();
    }
}

export {PBOptions};