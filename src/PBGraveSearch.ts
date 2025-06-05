// PBGraveSearch.ts
//
//  This class is part of the user interface.
//  Handles the display and search of the graves.

import {PBGrave} from './PBGrave.js';
import {PBPlot} from './PBPlot.js';
import {PBFace} from './PBFace.js';
import {PBRow} from './PBRow.js';
import {PBColumbarium} from './PBColumarium.js';
import {PBCemetery} from './PBCemetery.js';
import {GraveInfo, NicheInfo, AppOptions, RequestChangeGraveHTML} from './PBInterfaces';
import {PBConst} from './PBConst.js';

const NO_ROW_SELECTED = -1;

class PBGraveSearch {
    tableElement: HTMLTableElement;
    tableBodyElement: HTMLTableSectionElement;  // Contains the HTML for all of the graves that
                                                // will be displayed in the table.

    cemeteryNames: Array<string> = [];
    appOptions: AppOptions;

    populateIndex: number;  // From previous call to populateTable.  Used by add and delete grave.
    theGraveInfos: Array<GraveInfo> = [];   // This contains all of the GraveInfos for all of the graves
                                            // In all of the cemeteries, including those that have not been
                                            // assigned a plot.
    private canEdit: boolean = false;
    editing: boolean = false;
    theRows: HTMLCollection;    // Each of the above GraveInfos has an associated row with the HTML
                                // that will be used in the table.  As limitations are put on the
                                // search by cemetery or text, the rows that are excluded are
                                // marked as display none.  When a row is edited, its normal
                                // HTML is replaced with the row edit HTML and the edit
                                // elements are appended.  Since the rows are ordered
                                // alphabetically using the last name, any change to the
                                // name of the interred will trigger are reodering of
                                // the GraveInfos and a regeneration of this list.  NOTE that
                                // this element is "live" and is updated whenever tableBodyElement
                                // is updated.
    currentRowIndex: number = NO_ROW_SELECTED;
    currentRowOnClick: Function;
    visibleEntries: number; // The number of entries in the table that are visible.

    nameElement: HTMLInputElement = undefined;  // The elements that are used when a row is edited.
                                                // Are created in the constructor and recycle for
                                                // each row edit.
    datesElement: HTMLInputElement = undefined;
    plotElement: HTMLInputElement = undefined;
    faceElement: HTMLSelectElement = undefined;
    graveElement: HTMLSelectElement = undefined;

    private _isDirty: boolean = false;  // If true, changes have been made

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.cemeteries.forEach((cemetery) => {this.cemeteryNames.push(cemetery.name);});
        this.buildEmptyTableHTML();
        this.populateTable(-1); // Show all cemeteries by default.
        this.theRows = this.tableBodyElement.rows;
        this.createEditElements();
        this.initEventListeners();
    }

    initEventListeners () {
        // The row edit plot and grave onchange methods are set in createEditElements.
        window.addEventListener(PBConst.EVENTS.selectGraveRow, (event: CustomEvent) => {this.onSelectGraveRow(event);});
        window.addEventListener(PBConst.EVENTS.addGrave, (event: CustomEvent) => {this.onAddGrave(event);});
        window.addEventListener(PBConst.EVENTS.deleteGrave, (event: Event) => {this.onDeleteGrave(event);});
        window.addEventListener(PBConst.EVENTS.requestChangeGraveHTML, (event: CustomEvent) => {this.onRequestChangeGraveHTML(event);});
        window.addEventListener(PBConst.EVENTS.optionsChanged, (event: CustomEvent) => {this.onOptionsChanged(event);})
    }

    buildEmptyTableHTML() {
        // Builds the empty table.  Will be populated later.
        this.tableElement = document.createElement('table');
        this.tableElement.className = 'fixed-header-scrollable-table';
        this.tableElement.contentEditable = 'false';
        this.tableElement.innerHTML = `<thead>\n
                    <tr>\n<th>Cemetery</th>\n<th>Name</th>\n<th>Dates</th>\n<th>Location</th>\n</tr>\n
                  </thead>`;
        this.tableBodyElement = document.createElement('tbody');
        this.tableBodyElement.id = 'table-body-element';
        this.tableElement.appendChild(this.tableBodyElement);
    }

    getMaxPlots(cemeteryIndex: number): number {
        // Get maxPlots for this cemetery
        let maxPlots: number = 0;
        if (this.validCemeteryIndex(cemeteryIndex)) {
            // Cemeteries may not have defined plots
            maxPlots = this.cemeteries[cemeteryIndex].plots.length;
        }
        return(maxPlots);
    }

    getMaxPlotsByGraveInfo(theGraveInfo: GraveInfo): number {
        // Get maxPlots for this cemetery.  Just another way of calling getMaxPlots.
        return(this.getMaxPlots(theGraveInfo.cemeteryIndex));
    }

    validCemeteryIndex(theCemeteryIndex: number): boolean {
        // Check if cemetery is valid
        return((theCemeteryIndex >= 0) && (theCemeteryIndex < this.cemeteries.length));
    }
    validPlotIndex(theCemeteryIndex: number, thePlotIndex: number): boolean {
        // Check if cemetery and plot are valid
        let result: boolean = this.validCemeteryIndex(theCemeteryIndex);
        if (result) {
            let maxPlots: number = this.getMaxPlots(theCemeteryIndex);
            result = (thePlotIndex >= 0) && (thePlotIndex < maxPlots);
        }
        return(result);
    }

    validGraveIndex(thePlot: PBPlot, theGraveIndex: number): boolean {
        // Check if graveIndex is on this plot
        return( (thePlot instanceof PBPlot) && (theGraveIndex >= 0)  && (theGraveIndex < thePlot.graves.length));
    }

    validFaceIndex(theColumbarium: PBColumbarium, theFaceIndex: number): boolean {
        return((theColumbarium instanceof PBColumbarium) && (theFaceIndex >= 0) && (theFaceIndex < theColumbarium.numFaces));
    }

    validNicheIndex(theColumbarium: PBColumbarium, theFaceIndex: number, theRowIndex: number, theNicheIndex: number): boolean {
        // Check if passed parameters are all valid
        let result: boolean = false;
        if (this.validFaceIndex(theColumbarium, theFaceIndex) &&
            ((theRowIndex >= 0) && (theRowIndex < theColumbarium.faces[theFaceIndex].rows.length))) {
            let theRow: PBRow = theColumbarium.faces[theFaceIndex].rows[theRowIndex];
            if ((theNicheIndex >= 0) && (theNicheIndex < theRow.numNiches)) {
                result = true;
            }
        }
        return(result);
    }

    validGraveLocation(theCemeteryIndex: number, thePlotIndex: number, theGraveIndex: number, theFaceIndex: number, theRowIndex: number, theNicheIndex: number): boolean {
        let result: boolean = false;
        if (this.validCemeteryIndex(theCemeteryIndex) && this.validPlotIndex(theCemeteryIndex, thePlotIndex)) {
            let thePlot: PBPlot = this.getPlot(theCemeteryIndex, thePlotIndex);
            if (thePlot.columbarium) {
                result = this.validNicheIndex(thePlot.columbarium, theFaceIndex, theRowIndex, theNicheIndex);
            } else {
                result = this.validGraveIndex(thePlot, theGraveIndex);
            }
        }
        return(result);
    }

    insertRowEditHTML() {
        // Makes theCurrentRow editable.  theRow normally contains grave information.
        // This routine generates the HTML so that it displays controls that can edit
        // the names, dates, and optionally the plot, face and grave.  The empty HTML is
        // generated first, then the controls are appended.  The plot onchange event
        // is dispatched to populate the  edit controls.
        let theGraveInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        let theRow: HTMLTableRowElement = this.theRows[this.currentRowIndex] as HTMLTableRowElement;
        theRow.onclick = null;  // Need to disable onclick, otherwise clicking on one of the inputs below
                                // will generate a selectGraveRow event.  This will be restored by
                                // closeRowEdit.
        let theHTML: string = `<td>Names:<br>Dates:</td>
                        <td id="row-edit-name-div"></td>`;  // Cemetery name and name edit div
        let maxPlots: number = this.cemeteries[theGraveInfo.cemeteryIndex].plots.length;
        if (this.getMaxPlotsByGraveInfo(theGraveInfo) > 0) {
            theHTML +=  '<td>Plot:<br>Face:<br>Grave:</td>';
            theHTML += `<td id="row-edit-grave-div"></td>`;
        } else {
            theHTML += '<td></td><td class="no-plots">No Plots on this cemetery</td>';
        }
        theRow.innerHTML = theHTML;

        let nameDiv: HTMLDivElement = document.getElementById('row-edit-name-div') as HTMLDivElement;
        let graveDiv: HTMLDivElement = document.getElementById('row-edit-grave-div') as HTMLDivElement;
        this.appendEditElements(maxPlots, theGraveInfo, nameDiv, graveDiv);
        this.plotElement.value = (theGraveInfo.plotIndex + 1).toString();
        this.askForGraveChangeHTML();
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
        this.nameElement = this.myCreateElement(true, 'text', 'row-edit-name') as HTMLInputElement;
        this.datesElement = this.myCreateElement(true, 'text', 'row-edit-dates') as HTMLInputElement;
        this.plotElement = this.myCreateElement(true, 'number', 'row-edit-plot') as  HTMLInputElement;
        this.faceElement = this.myCreateElement(false, 'select', 'row-edit-face') as  HTMLSelectElement;
        this.graveElement = this.myCreateElement(false, 'select', 'row-edit-grave') as  HTMLSelectElement;

        this.nameElement.addEventListener('focusout', (event) => {this.onFocusOut(event);});
        this.plotElement.onchange = (event) => {this.onChangePlotNumber(event);};
        this.faceElement.onchange = (event) => {this.onChangeFace(event);}
        this.graveElement.onchange = (event) => {this.onChangeGraveNumber(event);}
    }

    appendEditElements(maxPlots: number, theGraveInfo: GraveInfo, nameDiv: HTMLDivElement, graveDiv: HTMLDivElement) {
        // The HTML for the edit has already been created with divs for the controls.
        // If there are no plots on the cemeteries then the controls are not appended.
        let thePlot: PBPlot = this.getPlotByGraveInfo(theGraveInfo);
        nameDiv.append(this.nameElement, this.datesElement);
        this.nameElement.value = theGraveInfo.theGrave.name;
        this.datesElement.value = theGraveInfo.theGrave.dates;

        if (maxPlots > 0) {
            graveDiv.append(this.plotElement);
            this.plotElement.max = maxPlots.toString();
            this.plotElement.value = (theGraveInfo.graveIndex + 1).toString();
            graveDiv.append(this.faceElement);
            graveDiv.append(this.graveElement);
            this.graveElement.value = (theGraveInfo.graveIndex + 1).toString();
        }
    }

    appendTableAndWarning(theDiv: HTMLDivElement) {
        // Called by PBUI so that we have access to the div
        // that is the parent of tableElement and
        theDiv.appendChild(this.tableElement);
        // this.tableElement.appendChild(this.noVisibleEntriesElement);
    }

    nicheHasChanged(newPlotIndex: number, newGraveIndex: number, newFaceIndex: number, graveInfo: GraveInfo): boolean {
    // Check for movement in the columbarium
    let hasChanged: boolean = false;
    let newPlot: PBPlot = this.getPlot(graveInfo.cemeteryIndex, newPlotIndex);
    if (newPlot &&
      newPlot.columbarium &&
      graveInfo.theNiche &&
      (graveInfo.theNiche.faceIndex != newFaceIndex)) { // TODO May need to check row and niche
            hasChanged = true;
    }
    return(hasChanged);
}

    graveIndexToRowNiche(graveIndex: number): [number, number] {
        let rowIndex: number = Math.round(graveIndex / 10);
         let nicheIndex: number= graveIndex % 10;
        return([rowIndex, nicheIndex]);
}

    graveMove(newPlotIndex: number, newGraveIndex: number, newFaceIndex: number, graveInfo: GraveInfo): boolean {
        // If the grave location changes, then the grave is moved, if a valid destination, and returns a true.
        // When invoked, graveInfo contains the source location.  The grave comes from either a plot or the
        // unassigned graves.  A grave from a plot is temporarily added to the unassigned graves.  If the destination
        // is valid then the grave is moved and the graveInfo contains the destination location.
        // NOTE: if newPlotIndex is a columbarium, then newGraveIndex is a combination of row and niche
        let result: boolean = false;
        let rowIndex: number, nicheIndex: number;   // On a columbarium the row and niche are encoded in the graveIndex
        [rowIndex, nicheIndex] = this.graveIndexToRowNiche(newGraveIndex);
        let theGrave = undefined;

        let graveChanged: boolean = graveInfo.graveIndex != newGraveIndex;
        let plotChanged: boolean = graveInfo.plotIndex != newPlotIndex;
        let nicheChanged: boolean = this.nicheHasChanged(newPlotIndex, newGraveIndex, newFaceIndex, graveInfo);

        if (graveChanged || plotChanged || nicheChanged) {
            // Source and destination are different.
            result = true;
            this.isDirty = true;

            // Remove the grave from its source.
            if (!this.validPlotIndex(graveInfo.cemeteryIndex, graveInfo.plotIndex)) {  // Brand new graves come from the unassigned graves.
                theGrave = this.cemeteries[graveInfo.cemeteryIndex].graves.splice(graveInfo.graveIndex, 1)[0];
            } else {    // Already placed graves are removed from their plot/columbarium
                let theOldPlot: PBPlot = this.cemeteries[graveInfo.cemeteryIndex].plots[graveInfo.plotIndex];
                if (theOldPlot.columbarium) {
                    theGrave = theOldPlot.columbarium.removeNiche(graveInfo);
                    graveInfo.theNiche = undefined;
                } else {
                    theGrave = theOldPlot.graves[graveInfo.graveIndex];
                    theOldPlot.graves[graveInfo.graveIndex] = null;
                }
            }

            // Place it in its destination.
            if (this.validGraveLocation(graveInfo.cemeteryIndex, newPlotIndex, newGraveIndex, newFaceIndex, rowIndex, nicheIndex)) {  // Valid destination
                // Put grave in its destination and update graveInfo and theNiche
                let theNewPlot: PBPlot = this.cemeteries[graveInfo.cemeteryIndex].plots[newPlotIndex];
                graveInfo.theGrave = theGrave;
                graveInfo.plotIndex = newPlotIndex;
                graveInfo.graveIndex = newGraveIndex;

                if (theNewPlot.columbarium) {   // Put the grave in a niche
                    graveInfo.theNiche = {
                        faceIndex: this.faceElement.selectedIndex,
                        rowIndex: rowIndex,
                        nicheIndex: nicheIndex
                    } as NicheInfo;
                    theNewPlot.columbarium.populateNicheInfoNames(graveInfo.theNiche);
                    theNewPlot.columbarium.setNiche(graveInfo);
                } else {    // Put the grave in a plot
                    theNewPlot.graves[newGraveIndex] = theGrave;
                }
                graveInfo.theGrave.updateSortName();
            } else {    // Invalid destination.  Add to unassigned.
                graveInfo.theGrave = theGrave;
                graveInfo.graveIndex = this.cemeteries[graveInfo.cemeteryIndex].graves.push(theGrave) - 1;
                graveInfo.plotIndex = PBConst.INVALID_PLOT;
            }
        }

        return(result);
    }

    searchGraveInfos(): string {
        // This method is only invoked in the debugger to track down missing graves.
        let numProblems: number = 0;
        this.theGraveInfos.forEach((theInfo: GraveInfo, index: number) => {
            if (!theInfo.theGrave) {
                console.log(`index: ${index},\n${JSON.stringify(theInfo)}`);
                numProblems++;
            }
        });
        let results: string = (numProblems) ? `${numProblems} graves missing.` : `No missing graves.`;
        console.log(results);
        return(results);
    }

    checkForGraveMove(): boolean {
        // Attempt to move the selected grave.
        // Return true if moved.
        let newPlotIndex = parseInt(this.plotElement.value) - 1;
        let newGraveIndex = parseInt(this.graveElement.value);
        let newFaceIndex = parseInt(this.faceElement.value);
        let graveInfo = this.theGraveInfos[this.currentRowIndex];
        return(this.graveMove(newPlotIndex, newGraveIndex, newFaceIndex, graveInfo));
    }

    getPlot(cemeteryIndex: number, plotIndex: number): PBPlot {
        let thePlot: PBPlot = null;
        if ((plotIndex >= 0) &&
            (plotIndex < this.getMaxPlots(cemeteryIndex))) {
            thePlot = this.cemeteries[cemeteryIndex].plots[plotIndex];
        }
        return(thePlot);
    }

    getPlotByGraveInfo(theGraveInfo: GraveInfo): PBPlot {
        return(this.getPlot(theGraveInfo.cemeteryIndex, theGraveInfo.plotIndex));
    }

    buildPlotColumbariumHTML(theGraveInfo: GraveInfo, theNicheInfo: NicheInfo, theGraveElement: HTMLSelectElement, theFaceElement: HTMLSelectElement) {
        // Update the grave and the face elements with the current information.
        let thePlot: PBPlot = this.getPlotByGraveInfo(theGraveInfo);
        theFaceElement.hidden = false;

        // Populate the faceElement
        let faceOptions: string = '';
        let selectedFaceIndex: number = (theNicheInfo.faceIndex >= 0) ? theNicheInfo.faceIndex : PBConst.INVALID_FACE;
        thePlot.columbarium.faces.forEach((theFace: PBFace, index: number) => {
            faceOptions += (!(index % 2)) ? `<optgroup label="${theFace.columbariumName}">\n` : '';  // The optgroup will display the columbariumName
            // and then group the faces under it.  Open on even...
            faceOptions +=  `<option value="${index}" 
                                 ${(index == selectedFaceIndex) ? ' selected ' : ' '}>
                                 ${theFace.faceName}
                             </option>`;
            faceOptions += ((index % 2)) ? `</optgroup>\n` : '';    // ...close on odd.
        });
        theFaceElement.innerHTML = faceOptions;

        // All of the niches in the face show up in this element.
        // They are displayed with row name that has the associated
        // niches under it.  After the niche number is S for single
        // or a D for double niche.
        // NOTE: the value is encoded as rowIndex * 10 plus nicheIndex.
        // This must be taken into account when updating the GraveInfo.
        if (selectedFaceIndex == PBConst.INVALID_FACE) {
            theFaceElement.selectedIndex = -1;
            theGraveElement.selectedIndex = -1;
            theGraveElement.innerHTML = '???';
        } else {    // Valid face
            let theFace: PBFace = thePlot.columbarium.faces[selectedFaceIndex];
            let rowNames: Array<string> = theFace.getRowNames();
            let selectedRowIndex: number = (theNicheInfo.rowIndex >= 0) ? theNicheInfo.rowIndex : PBConst.INVALID_ROW;
            let selectedNicheIndex: number = (theNicheInfo.nicheIndex >= 0) ? theNicheInfo.nicheIndex : PBConst.INVALID_GRAVE;
            let graveOptions: string = '';
            theFace.rows.forEach((theRow: PBRow, rowIndex: number) => {
                graveOptions += `<optgroup label="${rowNames[rowIndex]}">\n`;   // The optgroup will display the rowName and then group
                                                                                // the niches under it.
                for (let nicheIndex: number = 0; nicheIndex < theRow.graves.length; nicheIndex++) {
                    let selected: boolean = ((rowIndex == selectedRowIndex) && (nicheIndex == selectedNicheIndex));
                    graveOptions += `<option value="${rowIndex * 10 + nicheIndex}" 
                                        ${(theRow.graves[nicheIndex]) ? ' disabled' : ' '}
                                        ${selected ? ' selected' : ' '}>
                                        Niche ${nicheIndex + 1}${(theRow.urns[nicheIndex] == 2) ? 'D' : 'S'}
                                  </option>`;
                }
                graveOptions += `</optgroup>\n`;
            });
            theGraveElement.innerHTML = graveOptions;
            if ((selectedRowIndex == PBConst.INVALID_ROW) ||
                (selectedNicheIndex == PBConst.INVALID_GRAVE)) {    // The row/niche is not yet selected
                theGraveElement.selectedIndex = -1;
            }
        }
    }

    buildPlotGraveHTML(theGraveInfo: GraveInfo): string {
        // Generate HTML used in the graveElement during a row edit.
        let selectOptions: string = '';
        let thePlot: PBPlot = this.getPlotByGraveInfo(theGraveInfo);
        if (thePlot) {
            for (let graveIndex = 0; graveIndex < thePlot.graves.length; graveIndex++) {
                selectOptions += `<option value="${graveIndex}" 
                                        ${(thePlot.graves[graveIndex]) ? ' disabled' : ' '}
                                        ${(graveIndex == theGraveInfo.graveIndex) ? ' selected' : ' '}>
                                        ${graveIndex + 1}
                                  </option>`;
            }
        } else {
            selectOptions = '???';
        }   // Invalid plot on this cemetery
        return(selectOptions);
    }

    onRequestChangeGraveHTML(event: CustomEvent) {
        // This routine is used by both PBGraveSearch and PBAddGrave.
        // It is called in response to a requestChangeGraveHTML event
        // when the plot or face has been changed.  Information for the
        // graveInfo and optionally the nicheInfo is passed.
        //
        // HTML elements are passed so that they can be updated with
        // current information.  The following elements are passed:
        //      plotElement:    An InputElement with a range of 1 to
        //                      number of plots in the cemetery.
        //      faceElement:    Only if a columbarium is in the plot.
        //                      Has the names of the faces.  This is
        //                      a SelectElement.
        //      graveElement:   For a grave in a plot this is only a
        //                      list of numbers for the grave.  For a
        //                      columbarium this is a list of all of
        //                      niches for the face, which includes
        //                      the row and the niche number.
        // NOTE: Although this is a response to an event, it does not
        // dispatch an event that the caller waits on.
        let theMsg: RequestChangeGraveHTML = event.detail;
        let graveInfo: GraveInfo = {cemeteryIndex: theMsg.cemeteryIndex, plotIndex: theMsg.plotIndex, graveIndex: theMsg.graveIndex, theGrave: null};
        let maxPlots: number = this.getMaxPlotsByGraveInfo(graveInfo);
        let thePlot: PBPlot = this.getPlotByGraveInfo(graveInfo);
        let enablePlot: boolean = false;

        theMsg.plotElement.disabled = true;     // The plot is only valid if the cemetery has plots.  If the plot
                                                // has changed then both the grave and the face are invalid.
        theMsg.faceElement.disabled = true;     // The face is only valid if the plot has a columbarium.  If the
                                                // face has changed then the grave is invalid.
        theMsg.graveElement.disabled = true;

        if (thePlot) {  // This is a valid plot.
            enablePlot = true;

            if (thePlot.columbarium) {  // Need to update the face and possibly the grave.
                let nicheInfo: NicheInfo = {faceIndex: (theMsg.faceIndex >= 0) ? theMsg.faceIndex : PBConst.INVALID_FACE,
                                            rowIndex: (theMsg.rowIndex >= 0) ? theMsg.rowIndex : PBConst.INVALID_ROW,
                                            nicheIndex: (theMsg.nicheIndex >= 0) ? theMsg.nicheIndex : PBConst.INVALID_GRAVE,
                                            urns: (theMsg.nicheIndex >= 0) ? theMsg.nicheIndex : PBConst.INVALID_GRAVE
                                        } as NicheInfo;
                this.buildPlotColumbariumHTML(graveInfo, nicheInfo, theMsg.graveElement, theMsg.faceElement);
                theMsg.faceElement.disabled = false;
                if (nicheInfo.faceIndex == PBConst.INVALID_FACE) {
                    this.setSelectElementToInvalidIndex(theMsg.faceElement);    // Invalid face and disabled grave
                } else {
                    theMsg.graveElement.disabled = false;
                    if (nicheInfo.nicheIndex == PBConst.INVALID_GRAVE) {
                        this.setSelectElementToInvalidIndex(theMsg.graveElement);   // Invalid grave
                    }
                }
            } else {    // Just a regular plot.
                theMsg.graveElement.disabled = false;
                theMsg.graveElement.innerHTML = this.buildPlotGraveHTML(graveInfo);
                if (graveInfo.graveIndex == PBConst.INVALID_GRAVE) {    // No grave selected.
                    this.setSelectElementToInvalidIndex(theMsg.graveElement);
                }
            }
        } else {    // Not a valid plot
            if (maxPlots > 0) { // Plots exist on this cemetery
                enablePlot = true;  // enable the plot element but not the grave element
            }
        }

        if (enablePlot) {   // Enable the plot element
            theMsg.plotElement.disabled = false;
            // Need to update the limits of the plot element in case this is called by PBAddGrave.
            theMsg.plotElement.max = this.cemeteries[theMsg.cemeteryIndex].plots.length.toString();
            theMsg.plotElement.min = "1";
            theMsg.plotElement.value = (theMsg.plotIndex + 1).toString();
        }
    }

    askForGraveChangeHTML() {
        // The grave location has changed.  Need to update all of the edit elements
        // to reflect the new location.  Generate the data needed for the
        // requestGraveChangeHTML event and dispatch it.  The event will update all
        // of the edit elements.
        let theGraveInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        let maxPlots: number = this.getMaxPlotsByGraveInfo(theGraveInfo);
        let thePlotIndex: number = (maxPlots > 0) ? (parseInt((this.plotElement as HTMLInputElement).value) - 1) : PBConst.INVALID_PLOT;
        let detailObject: RequestChangeGraveHTML = {
            calledByAddGrave: false,
            cemeteryIndex: theGraveInfo.cemeteryIndex,
            plotIndex: thePlotIndex,
            graveIndex: (thePlotIndex == theGraveInfo.plotIndex) ? theGraveInfo.graveIndex : PBConst.INVALID_PLOT,
            graveElement: this.graveElement,
            plotElement: this.plotElement,
            faceElement: this.faceElement,
        };

        let thePlot : PBPlot = this.getPlot(theGraveInfo.cemeteryIndex, thePlotIndex);
        if (thePlot && thePlot.columbarium) {
            let nicheInfo: NicheInfo;
            if (!theGraveInfo.theNiche) {
                nicheInfo = {faceIndex: 0, rowIndex: 0, nicheIndex: 0} as NicheInfo;
                theGraveInfo.theNiche = nicheInfo;
            } else {
                nicheInfo = theGraveInfo.theNiche;
            }
            detailObject.faceIndex = nicheInfo.faceIndex;
            detailObject.rowIndex = nicheInfo.rowIndex;
            detailObject.nicheIndex = nicheInfo.nicheIndex;
        }
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.requestChangeGraveHTML, {detail: detailObject}))
    }

    onFocusOut(event: Event) {
        // Called when either the name or the dates element loses focus.
        let graveInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        if (graveInfo.theGrave &&
            graveInfo.theGrave.nameOrDatesChanged(this.nameElement.value, this.datesElement.value)) {
            this.isDirty = true;
        }
    }

    onChangeGraveNumber(event: Event) {
        this.isDirty = true;    // TODO: graveMove
        this.setSelectElementToValid(this.graveElement);
    }

    onChangeFace(event: Event) {
        this.setSelectElementToValid(this.faceElement);
        this.setSelectElementToInvalidIndex(this.graveElement);   // The grave still needs to be selected.
        if (this.checkForGraveMove()) {
            this.isDirty = true;
        }
        this.askForGraveChangeHTML();
    }

    setSelectElementToValid(theElement: HTMLSelectElement) {
        theElement.setCustomValidity('');
    }

    setSelectElementToInvalidIndex(theElement: HTMLSelectElement) {
        theElement.selectedIndex = -1;
        theElement.setCustomValidity('Invalid index');
    }

    onChangePlotNumber(event: Event) {
        // The plot number has changed.
        this.setSelectElementToInvalidIndex(this.graveElement);   // The grave still needs to be selected.
        this.setSelectElementToInvalidIndex(this.faceElement);    // And possibly the face.
        this.checkForGraveMove();
        this.askForGraveChangeHTML();
    }

    onOptionsChanged(event: CustomEvent) {
        // The options have changed.  Need to repopulate table based on current
        // grave.state settings.  Will receive an initial optionsChanged message
        // at startup before we are ready to update the table.
        this.appOptions = event.detail;
        this.populateTableAndFilter();
    }

    set edit(theValue: boolean) {
        this.canEdit = theValue;
        if (!theValue) {
            this.closeRowEdit();
        }
    }

    get edit(): boolean {
        return(this.canEdit);
    }

    set isDirty(theValue: boolean) {
        if (!theValue) {
            this._isDirty = false;
        } else {
            if (!this._isDirty) {
                this._isDirty = true;
                window.dispatchEvent(new CustomEvent(PBConst.EVENTS.isDirty, { detail:{}}));
            }
        }
    }

    get isDirty(): boolean {
        return(this._isDirty);
    }

    filterByTextAndState(theText: string) {
        // All of the rows are still part of the table, but only show the rows
        // that match theText and the state will display.  All other rows that
        // display set to none.
        this.visibleEntries = 0;
        this.closeRowEdit();
        theText.toLowerCase();
        let stripingIndex = 0;
        for (let index =0; index < this.theRows.length; index++) {
            let theGrave:PBGrave = this.theGraveInfos[index].theGrave;
            if (theGrave) {
                if (theGrave.textMatch(theText) && theGrave.stateMatch(this.appOptions)) {
                    (this.theRows[index] as HTMLTableRowElement).style.display = 'block';
                    this.theRows[index].className += (stripingIndex % 2) ? ' even-row' : ' odd-row';
                    stripingIndex++;
                    this.visibleEntries++;
                } else {
                    (this.theRows [index]as HTMLTableRowElement).style.display = 'none';
                }
            } else {
                theGrave;
            }
        }

        if (this.visibleEntries == 0) {
            // No entries to display
            this.tableBodyElement.innerHTML =
               `<tr>
                    <td> </td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                     <td colspan="4" style="text-align: center; color: red; font-weight: bold;">
                        No Entries Match the Search and Display Criteria.
                     </td>
                </tr>`;
        }
    }

    onSelectGraveRow(event: CustomEvent) {
        // The user has clicked on a row.
        if (this.canEdit){  // Enable for editing.
            if (this.editing) {
                this.closeRowEdit();    // Already editing another row.  Close it.
            }
            this.editing = true;
            this.currentRowIndex = event.detail.index;
            let theRow = this.theRows[this.currentRowIndex];
            this.currentRowOnClick = (theRow as HTMLTableRowElement).onclick;   // Need to save for when edit is finished.
            this.insertRowEditHTML();
        } else {    // Show the plot

        }
    }

    graveInfoByRowIndex(index: number): GraveInfo {
        return(this.theGraveInfos[index]);
    }

    dispatchUnselectRow() {
        // Tells PBUI to disable the delete button.
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.unselectGraveRow, { detail:{}}));
    }

    stopEditingRow() {
        // Remove the edit controls from this row and replace them with the
        // standard text.
        let theInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        let theGrave: PBGrave = theInfo.theGrave;
        let theRow: HTMLTableRowElement = this.theRows[this.currentRowIndex] as HTMLTableRowElement;

        theRow.onclick = this.currentRowOnClick as any;
        theRow.innerHTML =
          `<td>${this.cemeteryNames[theInfo.cemeteryIndex]}</td>
           <td>${theGrave.name}</td>
           <td>${theGrave.dates}</td>
           <td>${this.getLocationText(theInfo)}</td>`;

        this.currentRowIndex = NO_ROW_SELECTED;
        this.dispatchUnselectRow();
    }

    closeRowEdit(): boolean {
        // Stop editing.  Save the possible updates.  Restore the row.
        // If a grave has moved, then populateTable and return true.
        let result = false;
        if (this.editing) {
            this.editing = false;
            let theInfo = this.theGraveInfos[this.currentRowIndex];
            let theGrave = theInfo.theGrave;
            let theRow = this.theRows[this.currentRowIndex] as HTMLTableRowElement;

            // TODO No reason to check for updates here
            if (theGrave.nameOrDatesChanged(this.nameElement.value, this.datesElement.value) || this.checkForGraveMove()) {
                this.isDirty = true;
                result = true;
                this.populateTable(this.populateIndex);
                this.filterByTextAndState((document.getElementById('cemetery-search') as HTMLInputElement).value);
            } else {
                // No update, just need to restore the non-editable row
                theRow.onclick = this.currentRowOnClick as any;
                theRow.innerHTML =
                    `<td>${this.cemeteryNames[theInfo.cemeteryIndex]}</td>
                     <td>${theGrave.name}</td>
                     <td>${theGrave.dates}</td>
                     <td>${this.getLocationText(theInfo)}</td>`;
            }

            this.currentRowIndex = NO_ROW_SELECTED;
            this.dispatchUnselectRow();

            // TODO No longer creating new elements with each row edit.
            let theGraveElement = document.getElementById('row-edit-grave');
            if (theGraveElement)    // A precaution.  Since the edit elements are
                                    // obtained on a timer looking for this element,
                                    // delete this one so we can search for the new one.
                theGraveElement.parentNode.removeChild(theGraveElement);
        }
        return(result);
    }

    onAddGrave(event: CustomEvent){
        // Insert the new grave into the unassigned graves for the cemetery.
        // Assign it to a plot if necessary.
        let eventGraveInfo: GraveInfo = event.detail;
        this.isDirty = true;
        let theGraveIndex: number = this.cemeteries[eventGraveInfo.cemeteryIndex].addGraves(eventGraveInfo.theGrave);
        if ((eventGraveInfo.plotIndex >= 0) &&
            (eventGraveInfo.graveIndex >= 0)) {
            let theGraveInfo: GraveInfo = { cemeteryIndex: eventGraveInfo.cemeteryIndex,
                                            plotIndex: PBConst.INVALID_PLOT,
                                            graveIndex: theGraveIndex,
                                            theGrave: eventGraveInfo.theGrave,
                                            theNiche: eventGraveInfo.theNiche};
            let theNiche: NicheInfo = eventGraveInfo.theNiche;
            let faceIndex: number = (theNiche) ? theNiche.faceIndex : 0;
            this.graveMove(eventGraveInfo.plotIndex, eventGraveInfo.graveIndex, faceIndex, theGraveInfo);
        }
        this.populateTableAndFilter();
    }

    onDeleteGrave(event: Event) {
        // Can only delete the row that is currently selected
        // and editable.  Deleting the row does not make another
        // row selected by default.
        if (this.currentRowIndex >= 0) {
            this.isDirty = true;
            let theGraveInfo = this.theGraveInfos[this.currentRowIndex];
            this.cemeteries[theGraveInfo.cemeteryIndex].deleteGrave(theGraveInfo);
            this.populateTableAndFilter();
            this.dispatchUnselectRow();
        }
    }

    generateRowOnClickText(index: number):string {
        return(`"window.dispatchEvent(new CustomEvent('${PBConst.EVENTS.selectGraveRow}', { detail:{ index: ${index}}} ));"`);
    }

    getLocationText(theInfo: GraveInfo): string {
        let location: string = '';
        if (theInfo.theNiche) {
            let theNiche: NicheInfo = theInfo.theNiche;
            location = `${theNiche.faceName}, ${theNiche.rowName}, Niche ${theNiche.nicheIndex + 1}`;
        } else {
            location = (theInfo.plotIndex != PBConst.INVALID_PLOT) ? ('Plot ' + (theInfo.plotIndex + 1) + ', Grave ' + (theInfo.graveIndex + 1)) : 'unknown';
        }
        return(location);
    }

    sortGraveInfos() {
        this.theGraveInfos.sort((a: GraveInfo, b: GraveInfo) => {
            if (a && a.theGrave && b && b.theGrave) { // One of them doesn't exist.
                return ((a.theGrave.sortName > b.theGrave.sortName) ? 1 : -1);
            } else {
                console.log(`PBGraveSearch.sortGraveInfos: theGrave does not exist\na: ${JSON.stringify(a)}.\nb: ${JSON.stringify(b)}`);  // Should never come here
                return (1); // Should never come here
            }
        });
    }

    populateTable(theCemetery: number) {
        // Throw away the old table and create a new one.
        // Takes all of the graves from only one cemetery
        // or from all of them.
        this.closeRowEdit();
        this.currentRowIndex = NO_ROW_SELECTED;
        this.populateIndex = theCemetery;
        let startCemeteryIndex = theCemetery;
        let endCemeteryIndex = theCemetery;
        if ((theCemetery >= this.cemeteries.length) || (theCemetery < 0)) {
            startCemeteryIndex = 0; // Show all of the cemeteries.
            endCemeteryIndex = this.cemeteries.length - 1;
        }

        this.theGraveInfos = [];    // Get all of the GraveInfos.
        for (let cemeteryIndex = startCemeteryIndex; cemeteryIndex <= endCemeteryIndex; cemeteryIndex++) {
           this.theGraveInfos = this.theGraveInfos.concat(this.cemeteries[cemeteryIndex].getGraveInfos(cemeteryIndex));
        }

        this.sortGraveInfos();

        let theHTML = '';   // Build the HTML for the table.
        let rowIndex = 0;
        this.theGraveInfos.forEach((graveInfo: GraveInfo, index) => {
            if (graveInfo.theGrave) {
                theHTML += `<tr class="grave-state-${graveInfo.theGrave.state.toString()}"
                                style="display: block;"
                                onclick=${this.generateRowOnClickText(rowIndex)}>
                                <td>${this.cemeteryNames[graveInfo.cemeteryIndex]}</td>
                                <td>${graveInfo.theGrave.name}</td>
                                <td>${graveInfo.theGrave.dates}</td>
                                <td>${this.getLocationText(graveInfo)}</td>
                            </tr>`;
                rowIndex++;
            } else {
                console.log(`PBGraveSearch.populateTable: theGrave does not exist.\nindex: ${index}\ngraveInfo: ${JSON.stringify(graveInfo)}`);  // Should never come here
            }
        });

        this.tableBodyElement.innerHTML = theHTML;
    }

    populateTableAndFilter() {
        // The table has changed.  Redraw it based on the filter
        // and scroll to the last selected row.
        let scrollTop = this.tableBodyElement.scrollTop;
        this.populateTable(this.populateIndex);
        let searchElement = document.getElementById('cemetery-search') as HTMLInputElement;
        let theText = (searchElement) ? searchElement.value : '';
        this.filterByTextAndState(theText);
        this.tableBodyElement.scrollTop = scrollTop;
    }

}

export {PBGraveSearch};