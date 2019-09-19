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
        this.populateTable();
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

    populateTable() {
        let theHTML = '';
        this.cemeteries[0].graves.forEach((grave: PBGrave) => {
            theHTML += `<tr><td>St. Bernard</td><td>${grave.name}</td><td>${grave.dates}</td><td>unknown</td></tr>`;
        });
        this.tableBodyElement.innerHTML = theHTML;
    }
}

export {PBGraveSearch};