// PBOptions.ts
//
// Used for setting the options.  Extends PBOcclusion.

import {PBOcclusion} from "./PBOcclusion.js";
import {PBConst} from "./PBConst.js";

class PBOptions extends PBOcclusion {

    saveButton: HTMLButtonElement;
    exitButton: HTMLButtonElement;

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
                        </table>
                        <div class="button-div">
                            <button type="button" id="add-grave-exit" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.closeOptions}'))">Exit</button>
                        </div>`;
        return(theHTML);
    }

    initEventListeners() {
    }

    getElements() {
        // Get all of the elements
        this.saveButton = document.getElementById('add-grave-save') as HTMLButtonElement;
        this.exitButton = document.getElementById('add-grave-exit') as HTMLButtonElement;
    }

    onSaveClick(event: Event) {
    }

    onExitClick(event: Event) {
        this.deactivate();
    }
}

export {PBOptions};