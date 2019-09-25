// PBGraveSearch.ts
//
//  This class is part of the user interface.
//  Handles the display and search of the graves.

import {SerializableGrave} from './PBInterfaces.js';
import {PBGrave} from './PBGrave.js';
import {PBCemetery} from './PBCemetery.js';
import {PBConst} from './PBConst.js';

class PBGraveSearch {
    tableElement: HTMLTableElement;
    tableBodyElement: HTMLTableSectionElement;
    tableOverlayElement: HTMLDivElement;

    graveStrings: Array<string>;
    private _editing: boolean;

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.buildTable();
        this.buildTableOverlay();
        this.populateTable(-1);
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

    buildTableOverlay(){
        this.tableOverlayElement = document.createElement('div');
        this.tableElement.appendChild(this.tableOverlayElement);
        this.tableOverlayElement.className = 'table-overlay';
        this.tableOverlayElement.innerHTML = `<button>Previous</button>
                                              <button>Next</button>
                                              <button onclick="window.dispatchEvent(new Event('${PBConst.EVENTS.unselectGraveRow}'))" >Close</button>`;
    }

    set editing(theValue: boolean) {
        this._editing = theValue;
        if (!theValue) {
            this.closeOverlay();
        }
    }

    get editing(): boolean {
        return(this._editing);
    }

    onInput(theText: string) {
        theText.toLowerCase();
        let theRows = this.tableBodyElement.rows;
        let stripingIndex = 0;
        for (let index =0; index < theRows.length; index++) {
            if (this.graveStrings[index].includes(theText)) {
                theRows[index].style.display = 'block';
                theRows[index].className = (stripingIndex % 2) ? 'even-row' : 'odd-row';
                stripingIndex++;
            } else {
                theRows[index].style.display = 'none';
            }
        }
    }

    onSelectGraveRow(event: CustomEvent) {
        if (this._editing){
            this.tableOverlayElement.style.display = 'block';
        }
    }

    closeOverlay() {
        this.tableOverlayElement.style.display = 'none';
    }

    onUnselectGraveRow(event: Event) {
        this.closeOverlay();
    }

    populateTable(theCemetery: number) {
        let startIndex = theCemetery;
        let endIndex = theCemetery;
        if ((theCemetery >= this.cemeteries.length) || (theCemetery < 0)) {
            startIndex = 0;
            endIndex = this.cemeteries.length - 1;
        }
        let theHTML = '';
        this.graveStrings = [];
        let graveIndex = 0;
        for (let index = startIndex; index <= endIndex; index++) {
            this.cemeteries[index].graves.forEach((grave: PBGrave) => {
                theHTML += `<tr class="${(graveIndex % 2) ? 'odd-row' : 'even-row'}"
                                contenteditable="false"
                                onclick="window.dispatchEvent(new CustomEvent('${PBConst.EVENTS.selectGraveRow}', { detail:{ index: ${graveIndex}}} ));">
                                <td>${this.cemeteries[index].name}</td><td>${grave.name}</td><td>${grave.dates}</td><td>unknown</td>
                            </tr>`;
                this.graveStrings.push(grave.getText());
                graveIndex++;
            });
        }
        this.tableBodyElement.innerHTML = theHTML;
    }
}

export {PBGraveSearch};