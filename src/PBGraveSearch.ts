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

    constructor(public map: google.maps.Map, public cemeteries: Array<PBCemetery>) {
        this.buildTable();
        this.populateTable(-1);
    }

    buildTable() {
        this.tableElement = document.createElement('table');
        this.tableElement.className = 'fixed-header-scrollable-table';
        this.tableElement.innerHTML = `<thead>\n
                    <tr>\n<th>Cemetery</th>\n<th>Name</th>\n<th>Dates</th>\n<th>Location</th>\n</tr>\n
                  </thead>`;
        this.tableBodyElement = document.createElement('tbody');
        this.tableElement.appendChild(this.tableBodyElement);
    }

    onInput(event: InputEvent) {

    }

    populateTable(theCemetery: number) {
        let startIndex = theCemetery;
        let endIndex = theCemetery;
        if ((theCemetery >= this.cemeteries.length) || (theCemetery < 0)) {
            startIndex = 0;
            endIndex = this.cemeteries.length - 1;
        }
        let theHTML = '';
        for (let index = startIndex; index <= endIndex; index++) {
            this.cemeteries[index].graves.forEach((grave: PBGrave) => {
                theHTML += `<tr><td>${this.cemeteries[index].name}</td><td>${grave.name}</td><td>${grave.dates}</td><td>unknown</td></tr>`;
            });
        }
        this.tableBodyElement.innerHTML = theHTML;
    }
}

export {PBGraveSearch};