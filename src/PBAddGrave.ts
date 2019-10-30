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

    constructor(occludedDiv: HTMLDivElement) {
        super(occludedDiv, false);  // Generate the basic occlusion HTML without the text or the OK button
        this.initEventListeners();
        this.extraDiv.innerHTML = this.initAddElements();
    }

    initAddElements(): string {
        let theHTML = ` Cemetery: <select></select><br>
                        State: <select></select><br>
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

    }

}

export {PBAddGrave};