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
    }

    buildTableHTML (): string {
        setTimeout(() => {
            this.initElements();
            this.populateTable()}, 2000); // Cannot get the elements until the HTML has been added to the document.
        return(`<table id="searchtable" class="fixed-header-scrollable-table">\n
                  <thead>\n
                    <tr>\n<th>Cemetery</th>\n<th>Name</th>\n<th>Dates</th>\n<th>Location</th>\n</tr>\n
                  </thead>\n
                  <tbody id="searchtablebody">\n
                  </tbody>\n
                </table>`);
    }

    initElements() {
        this.tableElement = document.getElementById('searchtable') as HTMLTableElement;
        this.tableBodyElement = document.getElementById('searchtablebody') as HTMLTableSectionElement;
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