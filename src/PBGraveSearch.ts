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

    populateIndex: number;  // From previous call to populateTable.  Used by add and delete grave.
    theGraveInfos: Array<GraveInfo> = [];
    private canEdit: boolean = false;
    editing: boolean = false;
    theRows: HTMLCollection;
    currentRowIndex: number = NO_ROW_SELECTED;
    currentRowHTML: string;
    currentRowOnClick: Function;

    private _isDirty: boolean = false;  // If true, changes have been made

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.buildTable();
        this.populateTable(-1); // Show all cemeteries by default.
        this.theRows = this.tableBodyElement.rows;
        this.initEventListeners();
    }

    initEventListeners () {
        window.addEventListener(PBConst.EVENTS.selectGraveRow, (event: CustomEvent) => {this.onSelectGraveRow(event);});
        window.addEventListener(PBConst.EVENTS.addGrave, (event: Event) => {this.onAddGrave(event);});
        window.addEventListener(PBConst.EVENTS.deleteGrave, (event: Event) => {this.onDeleteGrave(event);});
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
        return(`<tr style="display: inline;">
                    ${theRow.firstElementChild.outerHTML}
                    <td><input type="text" id="row-edit-name" value="${theGrave.name}"></input></td>
                    <td><input type="text" id="row-edit-dates" value="${theGrave.dates}"></input></td>
                </tr>`);
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
        // The user has clicked on a row.  Enable for editing.
        // Only one row editable at a time, so may need to close
        // another row.
        if (this.canEdit){
            if (this.editing) {
                this.closeRowEdit();    // Already editing another row.  Close it.
            }
            this.editing = true;
            this.currentRowIndex = event.detail.index;
            let theRow = this.theRows[this.currentRowIndex];
            this.currentRowOnClick = (theRow as HTMLTableRowElement).onclick;   // Need to save for when edit is finished.
            this.currentRowHTML = theRow.innerHTML; // Will use this in buildRowEditHTML to get the cemetery name.
            theRow.innerHTML = this.buildRowEditHTML();
        }
    }

    updateGrave(theGrave: PBGrave): boolean {
        // Update the grave with the values from the edit controls.
        // Returns a true if changes occurred.
        let theOldName = theGrave.name;
        let theOldDates = theGrave.dates;
        theGrave.name = (document.getElementById('row-edit-name') as HTMLInputElement).value;
        theGrave.dates = (document.getElementById('row-edit-dates') as HTMLInputElement).value;
        let theResult = (theOldName == theGrave.name) && (theOldDates == theGrave.dates);
        return(!theResult);
    }

    closeRowEdit() {
        // Stop editing.  Save the possible updates.  Restore the row.
        if (this.editing) {
            this.editing = false;
            let theGrave = this.theGraveInfos[this.currentRowIndex].theGrave;
            let theRow = this.theRows[this.currentRowIndex] as HTMLTableRowElement;
            this.currentRowIndex = NO_ROW_SELECTED;

            if (this.updateGrave(theGrave))
                this.isDirty = true;

            theRow.onclick = this.currentRowOnClick as any;
            theRow.innerHTML =
                `${theRow.firstElementChild.outerHTML}
                 <td>${theGrave.name}</td>
                 <td>${theGrave.dates}</td>
                 <td>unknown</td>`;
            this.dispatchUnselectRow();
        }
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
            this.cemeteries[theGraveInfo.cemeteryIndex].deleteGrave(theGraveInfo.graveIndex);
            this.populateTable(this.populateIndex);
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

    populateTable(theCemetery: number) {
        // Throw away the old table and create a new one.
        // Takes all of the graves from only one cemetery
        // or from all of them.
        // Takes into account any active filter.
        this.closeRowEdit();
        this.currentRowIndex = NO_ROW_SELECTED;
        this.populateIndex = theCemetery;
        let startCemeteryIndex = theCemetery;
        let endCemeteryIndex = theCemetery;
        if ((theCemetery >= this.cemeteries.length) || (theCemetery < 0)) {
            startCemeteryIndex = 0; // Show all of the cemeteries.
            endCemeteryIndex = this.cemeteries.length - 1;
        }
        let theHTML = '';
        this.theGraveInfos = [];
        let graveIndex = 0;
        for (let cemeteryIndex = startCemeteryIndex; cemeteryIndex <= endCemeteryIndex; cemeteryIndex++) {
            this.cemeteries[cemeteryIndex].graves.forEach((grave: PBGrave, theGraveIndex) => {
                theHTML += `<tr class="${(graveIndex % 2) ? 'odd-row' : 'even-row'}"
                                style="display: block;"
                                onclick=${this.generateRowOnClickText(graveIndex)}>
                                <td>${this.cemeteries[cemeteryIndex].name}</td><td>${grave.name}</td><td>${grave.dates}</td><td>unknown</td>
                            </tr>`;
                this.theGraveInfos.push({cemeteryIndex: cemeteryIndex, graveIndex: theGraveIndex, theGrave: grave});
                graveIndex++;
            });
        }
        this.tableBodyElement.innerHTML = theHTML;
    }

}

export {PBGraveSearch};