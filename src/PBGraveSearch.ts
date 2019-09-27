// PBGraveSearch.ts
//
//  This class is part of the user interface.
//  Handles the display and search of the graves.

import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {GraveInfo} from './PBInterfaces';
import {PBConst} from './PBConst.js';

class PBGraveSearch {
    tableElement: HTMLTableElement;
    tableBodyElement: HTMLTableSectionElement;

    theGraveInfos: Array<GraveInfo>;
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
        window.addEventListener(PBConst.EVENTS.addGrave, (event: Event) => {this.onAddGrave(event);});
        window.addEventListener(PBConst.EVENTS.deleteGrave, (event: Event) => {this.onDeleteGrave(event);});
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
        let theGraveInfo: GraveInfo = this.theGraveInfos[this.currentRow];
        let theGrave: PBGrave = theGraveInfo.theGrave;
        let theRow = this.theRows[this.currentRow] as HTMLTableRowElement;
        theRow.onclick = null;
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

    onInput(theText: string) {
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
            let theGrave = this.theGraveInfos[this.currentRow].theGrave;
            let theRow = this.theRows[this.currentRow] as HTMLTableRowElement;
            theGrave.name = (document.getElementById('row-edit-name') as HTMLInputElement).value;
            theGrave.dates = (document.getElementById('row-edit-dates') as HTMLInputElement).value;
            theRow.onclick = this.currentRowOnClick as any;
            theRow.innerHTML =
                `${theRow.firstElementChild.outerHTML}
                 <td>${theGrave.name}</td>
                 <td>${theGrave.dates}</td>
                 <td>unknown</td>`
        }
    }

    onUnselectGraveRow(event: Event) {
        this.closeRowEdit();
        this.editing = false;
    }

    onAddGrave(event: Event){

    }

    onDeleteGrave(event: Event) {

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
        this.theGraveInfos = [];
        let graveIndex = 0;
        for (let index = startIndex; index <= endIndex; index++) {
            this.cemeteries[index].graves.forEach((grave: PBGrave, theGraveIndex) => {
                theHTML += `<tr class="${(graveIndex % 2) ? 'odd-row' : 'even-row'}"
                                style="display: block;"
                                onclick=${this.generateRowOnClickDispatch(graveIndex)}>
                                <td>${this.cemeteries[index].name}</td><td>${grave.name}</td><td>${grave.dates}</td><td>unknown</td>
                            </tr>`;
                this.theGraveInfos.push({cemeteryIndex: index, graveIndex: theGraveIndex, theGrave: grave});
                graveIndex++;
            });
        }
        this.tableBodyElement.innerHTML = theHTML;
    }
}

export {PBGraveSearch};