// PBGraveSearch.ts
//
//  This class is part of the user interface.
//  Handles the display and search of the graves.

import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {GraveInfo} from './PBInterfaces';
import {PBConst} from './PBConst.js';

const NO_ROW_SELECTED = -1;

class PBGraveSearch {
    tableElement: HTMLTableElement;
    tableBodyElement: HTMLTableSectionElement;

    cemeteryNames: Array<string> = [];

    populateIndex: number;  // From previous call to populateTable.  Used by add and delete grave.
    theGraveInfos: Array<GraveInfo> = [];
    private canEdit: boolean = false;
    editing: boolean = false;
    theRows: HTMLCollection;
    currentRowIndex: number = NO_ROW_SELECTED;
    currentRowHTML: string;
    currentRowOnClick: Function;

    nameElement: HTMLInputElement = undefined;
    datesElement: HTMLInputElement = undefined;
    plotElement: HTMLInputElement = undefined;
    graveElement: HTMLSelectElement = undefined;

    private _isDirty: boolean = false;  // If true, changes have been made

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.cemeteries.forEach((cemetery) => {this.cemeteryNames.push(cemetery.name);});
        this.buildTable();
        this.populateTable(-1); // Show all cemeteries by default.
        this.theRows = this.tableBodyElement.rows;
        this.initEventListeners();
    }

    initEventListeners () {
        window.addEventListener(PBConst.EVENTS.selectGraveRow, (event: CustomEvent) => {this.onSelectGraveRow(event);});
        window.addEventListener(PBConst.EVENTS.addGrave, (event: Event) => {this.onAddGrave(event);});
        window.addEventListener(PBConst.EVENTS.deleteGrave, (event: Event) => {this.onDeleteGrave(event);});
        window.addEventListener(PBConst.EVENTS.changePlotNumber, (event: Event) => {this.onChangePlotNumber(event);})
        window.addEventListener(PBConst.EVENTS.changeGraveNumber, (event: Event) => {this.onChangeGraveNumber(event);})
    }

    buildTable() {
        // Builds the empty table.  Will be populated later.
        this.tableElement = document.createElement('table');
        this.tableElement.className = 'fixed-header-scrollable-table';
        this.tableElement.contentEditable = 'false';
        this.tableElement.innerHTML = `<thead>\n
                    <tr>\n<th>Cemetery</th>\n<th>Name</th>\n<th>Dates</th>\n<th>Location</th>\n</tr>\n
                  </thead>`;
        this.tableBodyElement = document.createElement('tbody');
        this.tableElement.appendChild(this.tableBodyElement);
    }

    buildRowEditHTML(): string {
        // Make theCurrentRow editable
        let theGraveInfo: GraveInfo = this.theGraveInfos[this.currentRowIndex];
        let theGrave: PBGrave = theGraveInfo.theGrave;
        let theRow = this.theRows[this.currentRowIndex] as HTMLTableRowElement;
        theRow.onclick = null;  // Need to disable onclick, otherwise clicking on one of the inputs below
                                // will generate a selectGraveRow event.  This will be restored by
                                // closeRowEdit.
        return(`${theRow.firstElementChild.outerHTML}
                    <td ><input type="text" class="td-edit" id="row-edit-name" value="${theGrave.name}"></input></td>
                    <td><input type="text" class="td-edit" id="row-edit-dates" value="${theGrave.dates}"></input></td>
                    <td>
                        Plot:<input type="number" class="plot" min="1" max="165" style="width: 50px;" id="row-edit-plot" value="${theGraveInfo.plotIndex}" onchange="window.dispatchEvent(new Event('${PBConst.EVENTS.changePlotNumber}'))"></input>
                        Grave:<select style="width: 50px;" id="row-edit-grave"onchange="window.dispatchEvent(new Event('${PBConst.EVENTS.changeGraveNumber}'))">${this.buildPlotGraveSelectHTML(theGraveInfo)}</select>
                    </td>`);
    }

    getEditElements() {
        this.nameElement = document.getElementById('row-edit-name') as HTMLInputElement;
        this.datesElement = document.getElementById('row-edit-dates') as HTMLInputElement;
        this.plotElement = document.getElementById('row-edit-plot') as HTMLInputElement;
        this.graveElement = document.getElementById('row-edit-grave') as HTMLSelectElement;
    }

    moveGrave() {
        // Attempt to move the selected grave.
        // Return true if moved.
        let result = false;
        this.getEditElements();
        let newPlotIndex = parseInt(this.plotElement.value);
        let newGraveIndex = parseInt(this.graveElement.value);
        let graveInfo = this.theGraveInfos[this.currentRowIndex];
        if (this.plotElement.validity.valid) {
            if ((graveInfo.plotIndex != newPlotIndex) ||
                (graveInfo.graveIndex != newGraveIndex)) {
                newPlotIndex--;
                let theGrave = null;
                if (graveInfo.plotIndex == PBConst.INVALID_PLOT) {
                    // Take if from the unassigned graves.
                    theGrave = this.cemeteries[graveInfo.cemeteryIndex].graves.splice(graveInfo.graveIndex, 1)[0];
                } else {
                    let theOldPlot = this.cemeteries[graveInfo.cemeteryIndex].plots[graveInfo.plotIndex - 1];
                    theGrave = theOldPlot.graves[graveInfo.graveIndex];
                    theOldPlot.graves[graveInfo.graveIndex] = null;
                }
                this.cemeteries[graveInfo.cemeteryIndex].plots[newPlotIndex].graves[newGraveIndex] = theGrave;
                result = true;
            }
        }
        return(result);
    }

    onChangePlotNumber(event: Event) {
        let theGraveInfo = this.theGraveInfos[this.currentRowIndex];
        let shallowGraveInfo: GraveInfo = { cemeteryIndex: theGraveInfo.cemeteryIndex,
                                            graveIndex: theGraveInfo.graveIndex,
                                            plotIndex: parseInt((document.getElementById('row-edit-plot') as HTMLInputElement).value, 10),
                                            theGrave: undefined};
        let selectElement = document.getElementById('row-edit-grave') as HTMLSelectElement;
        selectElement.innerHTML =  this.buildPlotGraveSelectHTML(shallowGraveInfo);
        this.isDirty = true;
    }

    onChangeGraveNumber(event: Event) {
        this.isDirty = true;
    }

    buildPlotGraveSelectHTML(theGraveInfo: GraveInfo): string {
        // The options for the drop down grave list based on the plot
        let selectOptions: string = '';
        if (theGraveInfo.plotIndex != PBConst.INVALID_PLOT) {   // Looking at a plot
            let thePlot = this.cemeteries[theGraveInfo.cemeteryIndex].plots[theGraveInfo.plotIndex - 1];
            if (thePlot) {
                for (let graveIndex = 0; graveIndex < thePlot.graves.length; graveIndex++) {
                    selectOptions += `<option value="${graveIndex}" 
                                            ${(thePlot.graves[graveIndex]) ? ' disabled' : ' '}
                                            ${(graveIndex == theGraveInfo.graveIndex) ? ' selected' : ' '}>
                                            ${graveIndex + 1}
                                      </option>`;
                }
            } else {selectOptions = '???'}
        } else {selectOptions = '???'}
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

    filterByText(theText: string) {
        // All of the rows are still part of the table,
        // but only show the rows that match theText.
        this.closeRowEdit();
        theText.toLowerCase();
        let stripingIndex = 0;
        for (let index =0; index < this.theRows.length; index++) {
            if (this.theGraveInfos[index].theGrave.textMatch(theText)) {
                (this.theRows[index] as HTMLTableRowElement).style.display = 'block';
                this.theRows[index].className = (stripingIndex % 2) ? 'even-row' : 'odd-row';
                stripingIndex++;
            } else {
                (this.theRows [index]as HTMLTableRowElement).style.display = 'none';
            }
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
            this.currentRowHTML = theRow.innerHTML; // Will use this in buildRowEditHTML to get the cemetery name.
            theRow.innerHTML = this.buildRowEditHTML();
        } else {    // Show the plot

        }
    }

    updateGrave(theGrave: PBGrave): boolean {
        // Update the grave with the values from the edit controls.
        // Returns a true if changes occurred.
        let theOldName = theGrave.name;
        let theOldDates = theGrave.dates;
        this.getEditElements();
        theGrave.name = this.nameElement.value;
        theGrave.dates = this.datesElement.value;
        theGrave.updateSortName();
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

            if (this.updateGrave(theGrave))
                this.isDirty = true;
            if (this.moveGrave()) {
                this.isDirty = true;
                result = true;
                this.populateTable(this.populateIndex);
                this.filterByText((document.getElementById('cemetery-search') as HTMLInputElement).value);
            } else {
                theRow.onclick = this.currentRowOnClick as any;
                theRow.innerHTML =
                    `${theRow.firstElementChild.outerHTML}
                     <td>${theGrave.name}</td>
                     <td>${theGrave.dates}</td>
                     <td>${this.getLocationText(theInfo)}</td>`;
            }
            this.currentRowIndex = NO_ROW_SELECTED;
            this.dispatchUnselectRow();
        }
        return(result);
    }

    onAddGrave(event: Event){
        this.isDirty = true;
    }

    onDeleteGrave(event: Event) {
        // Can only delete the row that is currently selected
        // and editable.  Deleting the row does not make another
        // row selected by default.
        if (this.currentRowIndex >= 0) {
            this.isDirty = true;
            let scrollTop = this.tableBodyElement.scrollTop;
            let theGraveInfo = this.theGraveInfos[this.currentRowIndex];
            this.cemeteries[theGraveInfo.cemeteryIndex].deleteGrave(theGraveInfo);
            this.populateTable(this.populateIndex);
            this.filterByText((document.getElementById('cemetery-search') as HTMLInputElement).value);
            this.tableBodyElement.scrollTop = scrollTop;
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
        let location: string = (theInfo.plotIndex != PBConst.INVALID_PLOT) ? ('Plot ' + theInfo.plotIndex + ', Grave ' + (theInfo.graveIndex + 1)) : 'unknown';
        return(location);
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

        this.theGraveInfos.sort((a: GraveInfo, b: GraveInfo) => {
            return( (a.theGrave.sortName > b.theGrave.sortName) ? 1 : -1);
        });

        let theHTML = '';   // Build the HTML for the table.
        let rowIndex = 0;
        this.theGraveInfos.forEach((graveInfo: GraveInfo, index) => {
            theHTML += `<tr class="${(rowIndex % 2) ? 'odd-row' : 'even-row'}"
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

}

export {PBGraveSearch};