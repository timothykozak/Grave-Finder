// PBAddGrave.ts
//
// Used for adding a grave.  Extends PBOcclusion.

import {SerializableGrave, GraveState} from "./PBInterfaces.js";
import {PBOcclusion} from "./PBOcclusion.js";
import {PBConst} from "./PBConst.js";

class PBAddGrave extends PBOcclusion implements SerializableGrave {
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
        let buttonElement = document.getElementById('add-grave-exit');
        if (buttonElement)
            this.onElementsInstantiated();
        else
            setTimeout(() => {this.waitForElementsToBeInstantiated();}, 100);
    }

    initAddElements(): string {
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
        window.addEventListener(PBConst.EVENTS.addGraveUIElements, (event: Event) => {this.onElementsInstantiated();})
    }

    onElementsInstantiated() {
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