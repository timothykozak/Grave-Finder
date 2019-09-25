// PBGraveSearch.ts
//
//  This class is part of the user interface.
//  Handles the display and search of the graves.

import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {PBConst} from './PBConst.js';

class PBGraveSearch {
    tableElement: HTMLTableElement;
    tableBodyElement: HTMLTableSectionElement;

    theGraves: Array<PBGrave>;
    private canEdit: boolean;
    editing: boolean;
    theRows: HTMLCollection;
    currentRow: number;
    currentRowHTML: string;
    currentRowOnClick: Function;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.buildTable();
        this.populateTable(-1);
        this.theRows = this.tableBodyElement.rows;
        this.initEventListeners();
    }

    initEventListeners () {
        window.addEventListener(PBConst.EVENTS.selectGraveRow, (event: CustomEvent) => {this.onSelectGraveRow(event);});
        window.addEventListener(PBConst.EVENTS.unselectGraveRow, (event: Event) => {this.onUnselectGraveRow(event);});
    }

    buildTable() {
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
        let theGrave = this.theGraves[this.currentRow];
        (this.theRows[this.currentRow] as HTMLTableRowElement).onclick = null;
        return(`<tr style="display: inline;">
                    <td>Cemetery</td>
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

    onInput(theText: string) {
        this.closeRowEdit();
        theText.toLowerCase();
        let stripingIndex = 0;
        for (let index =0; index < this.theRows.length; index++) {
            if (this.theGraves[index].textMatch(theText)) {
                (this.theRows[index] as HTMLTableRowElement).style.display = 'block';
                this.theRows[index].className = (stripingIndex % 2) ? 'even-row' : 'odd-row';
                stripingIndex++;
            } else {
                (this.theRows [index]as HTMLTableRowElement).style.display = 'none';
            }
        }
    }

    onSelectGraveRow(event: CustomEvent) {
        if (this.canEdit){
            if (this.editing) {
                this.closeRowEdit();
            }
            this.editing = true;
            this.currentRow = event.detail.index;
            let theRow = this.theRows[this.currentRow];
            this.currentRowOnClick = (theRow as HTMLTableRowElement).onclick;
            this.currentRowHTML = theRow.innerHTML;
            theRow.innerHTML = this.buildRowEditHTML();
        }
    }

    closeRowEdit() {
        if (this.editing) {
            this.editing = false;
            let theGrave = this.theGraves[this.currentRow];
            theGrave.name = (document.getElementById('row-edit-name') as HTMLInputElement).value;
            theGrave.dates = (document.getElementById('row-edit-dates') as HTMLInputElement).value;
            (this.theRows[this.currentRow] as HTMLTableRowElement).onclick = this.currentRowOnClick as any;
            this.theRows[this.currentRow].innerHTML =
                `<td>The Cemetery</td>
                 <td>${theGrave.name}</td>
                 <td>${theGrave.dates}</td>
                 <td>unknown</td>`
        }
    }

    onUnselectGraveRow(event: Event) {
        this.closeRowEdit();
        this.editing = false;
    }

    generateRowOnClickDispatch(index: number):string {
        return(`"window.dispatchEvent(new CustomEvent('${PBConst.EVENTS.selectGraveRow}', { detail:{ index: ${index}}} ));"`);
    }

    populateTable(theCemetery: number) {
        this.closeRowEdit();
        let startIndex = theCemetery;
        let endIndex = theCemetery;
        if ((theCemetery >= this.cemeteries.length) || (theCemetery < 0)) {
            startIndex = 0;
            endIndex = this.cemeteries.length - 1;
        }
        let theHTML = '';
        this.theGraves = [];
        let graveIndex = 0;
        for (let index = startIndex; index <= endIndex; index++) {
            this.cemeteries[index].graves.forEach((grave: PBGrave) => {
                theHTML += `<tr class="${(graveIndex % 2) ? 'odd-row' : 'even-row'}"
                                style="display: block;"
                                onclick=${this.generateRowOnClickDispatch(graveIndex)}>
                                <td>${this.cemeteries[index].name}</td><td>${grave.name}</td><td>${grave.dates}</td><td>unknown</td>
                            </tr>`;
                this.theGraves.push(grave);
                graveIndex++;
            });
        }
        this.tableBodyElement.innerHTML = theHTML;
    }
}

export {PBGraveSearch};