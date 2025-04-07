// PBGraveSearch.ts
//
//  This class is part of the user interface.
//  Handles the display and search of the graves.

import {PBGrave} from './PBGrave.js';
import {PBPlot} from './PBPlot.js';
import {PBFace} from './PBFace.js';
import {PBRow} from './PBRow.js';
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
        // The row edit plot and grave onchange methods are set in getEditElements.
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

    getMaxPlots(theGraveInfo: GraveInfo): number {
        return(this.cemeteries[theGraveInfo.cemeteryIndex].plots.length);
    }

    insertRowEditHTML() {
        // Makes theCurrentRow editable.  theRow normally contains grave information.
        // This routine generates the HTML so that it displays controls that can edit
        // the names, dates, plot, grave and optionally the face.  The empty HTML is
        // generated first, then the controls are appended.  The plot onchange event
        // is dispatched to populate the  edit controls.
        let theGraveInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        let theGrave: PBGrave = theGraveInfo.theGrave;
        let theRow = this.theRows[this.currentRowIndex] as HTMLTableRowElement;
        theRow.onclick = null;  // Need to disable onclick, otherwise clicking on one of the inputs below
                                // will generate a selectGraveRow event.  This will be restored by
                                // closeRowEdit.
        let theHTML: string = `<td>Names:<br>Dates:</td>
                        <td id="row-edit-name-div"></td>`;  // Cemetery name and name edit div
        let maxPlots: number = this.cemeteries[theGraveInfo.cemeteryIndex].plots.length;
        if (this.getMaxPlots(theGraveInfo) > 0) {
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
        this.plotElement.dispatchEvent(new Event("change"));    // Fake a plot change event to populate the faceElement and the graveElement
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

        this.plotElement.onchange = (event) => {this.onChangePlotNumber(event);};
        this.faceElement.onchange = (event) => {this.onChangeFace(event);}
        this.graveElement.onchange = (event) => {this.onChangeGraveNumber(event);}
    }

    appendEditElements(maxPlots: number, theGraveInfo: GraveInfo, nameDiv: HTMLDivElement, graveDiv: HTMLDivElement) {
        // The HTML for the edit has already been created with divs for the controls.
        // If there are no plots on the cemeteries then the controls are not appended.
        let thePlot: PBPlot = this.getPlot(theGraveInfo);
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

    graveMove(newPlotIndex: number, newGraveIndex: number, graveInfo: GraveInfo): boolean {
        // Moves a grave from either a plot or the unassigned graves to a new destination.
        // Returns true if the move occurred.
        let result = false;
        if ((newPlotIndex >= 0) && (newGraveIndex >= 0)) {  // Valid destination
            if ((graveInfo.plotIndex != newPlotIndex) ||
                (graveInfo.graveIndex != newGraveIndex)) {  // Source and destination are different
                let theGrave = null;
                if (graveInfo.plotIndex == PBConst.INVALID_PLOT) {  // Brand new graves come from the unassigned graves.
                    theGrave = this.cemeteries[graveInfo.cemeteryIndex].graves.splice(graveInfo.graveIndex, 1)[0];
                } else {    // Remove the grave from its source
                    let theOldPlot = this.cemeteries[graveInfo.cemeteryIndex].plots[graveInfo.plotIndex];
                    if (theOldPlot.columbarium) {
                        theGrave = theOldPlot.columbarium.removeNiche(graveInfo);
                    } else {
                        theGrave = theOldPlot.graves[graveInfo.graveIndex];
                        theOldPlot.graves[graveInfo.graveIndex] = null;
                    }
                }
                // Put grave in its destination
                let theNewPlot : PBPlot = this.cemeteries[graveInfo.cemeteryIndex].plots[newPlotIndex];
                if (theNewPlot.columbarium) {
                    graveInfo.theGrave = theGrave;
                    theNewPlot.columbarium.setNiche(graveInfo);
                } else {
                    theNewPlot.graves[newGraveIndex] = theGrave;
                }
                result = true;
            }
        }
        return(result);
    }

    checkForGraveMove() {
        // Attempt to move the selected grave.
        // Return true if moved.
        let newPlotIndex = parseInt(this.plotElement.value) - 1;
        let newGraveIndex = parseInt(this.graveElement.value);
        let graveInfo = this.theGraveInfos[this.currentRowIndex];
        return(this.graveMove(newPlotIndex, newGraveIndex, graveInfo));
    }

    onChangePlotNumber(event: Event) {
        // The plot number has changed.  Need to update the HTML for
        // the grave element and possibly change the min and max on
        // the plot element if this is from add grave.  This is also
        // called to update the elements without a plot change.
        let theGraveInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        let maxPlots: number = this.getMaxPlots(theGraveInfo);
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

        let thePlot : PBPlot = this.getPlot(theGraveInfo);
        if (thePlot && thePlot.columbarium) {
            let nicheInfo: NicheInfo = theGraveInfo.theNiche;
            detailObject.faceIndex = nicheInfo.faceIndex;
            detailObject.rowIndex = nicheInfo.rowIndex;
            detailObject.nicheIndex = nicheInfo.nicheIndex;
        }
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.requestChangeGraveHTML, {detail: detailObject}))
    }

    getPlot(theGraveInfo: GraveInfo): PBPlot {
        let thePlot: PBPlot = null;
        if ((theGraveInfo.plotIndex >= 0) &&
            (theGraveInfo.plotIndex < (this.getMaxPlots(theGraveInfo) - 1))) {
            thePlot = this.cemeteries[theGraveInfo.cemeteryIndex].plots[theGraveInfo.plotIndex];
        }
        return(thePlot);
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
        let thePlot: PBPlot = this.getPlot(graveInfo);

        theMsg.plotElement.disabled = true;   // These elements are not always valid for a cemetery/plot
        theMsg.graveElement.disabled = true;
        theMsg.faceElement.disabled = true;

        if (thePlot) {
            if (thePlot.columbarium) {
                let nicheInfo: NicheInfo = {faceIndex: (theMsg.faceIndex) ? theMsg.faceIndex : -1,
                                            rowIndex: (theMsg.rowIndex) ? theMsg.rowIndex : -1,
                                            nicheIndex: (theMsg.nicheIndex) ? theMsg.nicheIndex : -1,
                                            urns: (theMsg.nicheIndex) ? theMsg.nicheIndex : -1
                                        } as NicheInfo;
                this.buildPlotColumbarium(graveInfo, nicheInfo, theMsg.graveElement, theMsg.faceElement);
                theMsg.faceElement.disabled = false;
            } else {
                theMsg.graveElement.innerHTML = this.buildPlotGraveHTML(graveInfo);
                theMsg.faceElement.innerHTML = '';
            }
        } else {
            theMsg.graveElement.innerHTML = '???';
        }

        let maxPlot: number = this.cemeteries[theMsg.cemeteryIndex].plots.length;
        if (maxPlot) {  // Plots defined on this cemetery.
            theMsg.plotElement.disabled = false;
            theMsg.plotElement.max = this.cemeteries[theMsg.cemeteryIndex].plots.length.toString();
            theMsg.plotElement.min = "1";
            theMsg.plotElement.value = (theMsg.plotIndex + 1).toString();

            if ((theMsg.plotIndex >= 0) && (theMsg.plotIndex < maxPlot)) {    // Valid plot, show graveElement
                theMsg.graveElement.disabled = false;
                theMsg.graveElement.selectedIndex = theMsg.graveIndex;
            }
        }

        if (!theMsg.calledByAddGrave)
            this.isDirty = true;
    }

    onChangeFace(event: Event) {
        this.isDirty = true;
        this.plotElement.dispatchEvent(new Event("change"));    // Fake a plot change event to populate the faceElement and the graveElement
    }

    onChangeGraveNumber(event: Event) {
        this.isDirty = true;
    }

    onOptionsChanged(event: CustomEvent) {
        // The options have changed.  Need to repopulate table based on current
        // grave.state settings.  Will receive an initial optionsChanged message
        // at startup before we are ready to update the table.
        this.appOptions = event.detail;
        this.populateTableAndFilter();
    }

    buildPlotColumbarium(theGraveInfo: GraveInfo, theNicheInfo: NicheInfo, theGraveElement: HTMLSelectElement, theFaceElement: HTMLSelectElement) {
        // Update the grave and the face elements with the current information.
        let thePlot: PBPlot = this.getPlot(theGraveInfo);
        theFaceElement.hidden = false;

        // Populate the faceElement
        let faceOptions: string = '';
        let selectedFaceIndex: number = (theNicheInfo.faceIndex >= 0) ? theNicheInfo.faceIndex : 0;
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
        let theFace: PBFace = thePlot.columbarium.faces[selectedFaceIndex];
        let rowNames: Array<string> = theFace.getRowNames();
        let selectedRowIndex: number = (theNicheInfo.rowIndex >= 0) ? theNicheInfo.rowIndex : 0;
        let selectedNicheIndex: number = (theNicheInfo.nicheIndex >= 0) ? theNicheInfo.nicheIndex : 0;
        let graveOptions: string = '';
        theFace.rows.forEach((theRow: PBRow, rowIndex: number) => {
            graveOptions += `<optgroup label="${rowNames[rowIndex]}">\n`;   // The optgroup will display the rowName and then group
                                                                            // the niches under it.
            for (let nicheIndex: number = 0; nicheIndex < theRow.graves.length; nicheIndex++) {
                graveOptions +=  `<option value="${rowIndex * 10 + nicheIndex}" 
                                        ${(theRow.graves[nicheIndex]) ? ' disabled' : ' '}>
                                        Niche ${nicheIndex + 1}${(theRow.urns[nicheIndex] == 2) ? 'D' : 'S'}
                                  </option>`;
            }
            graveOptions += `</optgroup>\n`;
        });
        theGraveElement.innerHTML = graveOptions;
        theGraveElement.selectedIndex = (selectedRowIndex * theFace.rows[0].urns.length) + selectedNicheIndex + 1;
    }

    buildPlotGraveHTML(theGraveInfo: GraveInfo): string {
        // Generate HTML used in the graveElement during a row edit.
        let selectOptions: string = '';
        let thePlot: PBPlot = this.getPlot(theGraveInfo);
        if (thePlot) {
            for (let graveIndex = 0; graveIndex < thePlot.graves.length; graveIndex++) {
                selectOptions += `<option value="${graveIndex}" 
                                        ${(thePlot.graves[graveIndex]) ? ' disabled' : ' '}
                                        ${(graveIndex == theGraveInfo.graveIndex) ? ' selected' : ' '}>
                                        ${graveIndex + 1}
                                  </option>`;
            }
        } else {selectOptions = '???';}   // Invalid plot on this cemetery
        return(selectOptions);
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
            if (theGrave.textMatch(theText) && theGrave.stateMatch(this.appOptions)) {
                (this.theRows[index] as HTMLTableRowElement).style.display = 'block';
                this.theRows[index].className += (stripingIndex % 2) ? ' even-row' : ' odd-row';
                stripingIndex++;
                this.visibleEntries++;
            } else {
                (this.theRows [index]as HTMLTableRowElement).style.display = 'none';
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

    updateGraveInfo(theGraveInfo: GraveInfo): boolean {
        // Update the grave with the values from the edit controls.
        // Returns a true if changes occurred.
        let theGrave: PBGrave = theGraveInfo.theGrave;
        let theOldName = theGrave.name;
        let theOldDates = theGrave.dates;
        theGrave.name = this.nameElement.value;
        theGrave.dates = PBGrave.getDatesByState(this.datesElement.value, theGrave.state);
        theGrave.updateSortName();

        let thePlot: PBPlot = this.getPlot(theGraveInfo);
        if (thePlot && thePlot.columbarium) {
            theGraveInfo.theNiche = {faceIndex: this.faceElement.selectedIndex,
                                     rowIndex: Math.round((this.graveElement.selectedIndex +1) / 10),
                                     nicheIndex: (this.graveElement.selectedIndex + 1) % 10} as NicheInfo;
            thePlot.columbarium.populateNicheInfoNames(theGraveInfo.theNiche);
        }
        let theResult = (theOldName == theGrave.name) && (theOldDates == theGrave.dates);
        return(!theResult);
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

            if (this.updateGraveInfo(theInfo) || this.checkForGraveMove()) {
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
            this.graveMove(eventGraveInfo.plotIndex, eventGraveInfo.graveIndex, theGraveInfo);
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

    dispatchUnselectRow() {
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.unselectGraveRow, { detail:{}}));
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
            return( (a.theGrave.sortName > b.theGrave.sortName) ? 1 : -1);
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
            theHTML += `<tr class="grave-state-${graveInfo.theGrave.state.toString()}"
                                style="display: block;"
                                onclick=${this.generateRowOnClickText(rowIndex)}>
                                <td>${this.cemeteryNames[graveInfo.cemeteryIndex]}</td>
                                <td>${graveInfo.theGrave.name}</td>
                                <td>${graveInfo.theGrave.dates}</td>
                                <td>${this.getLocationText(graveInfo)}</td>
                            </tr>`;
            rowIndex++;
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