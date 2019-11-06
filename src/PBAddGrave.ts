// PBAddGrave.ts
//
// Used for adding a grave.  Extends PBOcclusion.

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

    constructor(occludedDiv: HTMLDivElement) {
        super(occludedDiv, false);  // Generate the basic occlusion HTML without the text or the OK button
        this.initEventListeners();
        this.waitForElementsToBeInstantiated();
        this.extraDiv.innerHTML = this.initAddElements();
    }

    waitForElementsToBeInstantiated() {
        // Can't get the elements until they have been instantiated.
        // Wait until the last one is instantiated.
        let buttonElement = document.getElementById('add-grave-exit');
        if (buttonElement)
            this.getElements();
        else
            setTimeout(() => {this.waitForElementsToBeInstantiated();}, 100);
    }

    initAddElements(): string {
        // Add all of the elements to define the grave.
        let theHTML = ` Cemetery: <select id="add-grave-cemetery"></select><br>
                        State: <select id="add-grave-state"></select><br>
                        Name:  <input type="text" class="" id="add-grave-name"><br>
                        Dates: <input type="text" class="" id="add-grave-dates"><br>
                        Plot:  <input type="number" class="plot" min="1" max="165" style="width: 50px;" id="add-grave-plot" onchange="window.dispatchEvent(new Event('${PBConst.EVENTS.changePlotNumber}'))"> </input>
                        Grave: <select style="width: 50px;" id="add-grave-grave" onchange="window.dispatchEvent(new Event('${PBConst.EVENTS.changeGraveNumber}'))"></select><br>
                        <div class="button-div">
                            <button type="button" id="add-grave-save" onclick="">Save</button>
                            <button type="button" id="add-grave-exit" onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.closeAddGraveUI}'))">Exit</button>
                        </div>`;
        return(theHTML);
    }

    initEventListeners() {
    }

    getElements() {
        this.cemeteryElement = document.getElementById('add-grave-cemetery') as HTMLSelectElement;
        this.stateElement = document.getElementById('add-grave-state') as HTMLSelectElement;
        this.nameElement = document.getElementById('add-grave-name')as HTMLInputElement;
        this.datesElement = document.getElementById('add-grave-dates') as HTMLInputElement;
        this.plotElement = document.getElementById('add-grave-plot') as HTMLInputElement;
        this.graveElement = document.getElementById('add-grave-grave') as HTMLSelectElement;
        this.saveButton = document.getElementById('add-grave-save') as HTMLButtonElement;
        this.exitButton = document.getElementById('add-grave-exit') as HTMLButtonElement;
    }

}

export {PBAddGrave};