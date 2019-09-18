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
            this.populateTable()}, 1000); // Cannot get the elements until the HTML has been added to the document.
        return(`<table id="searchtable" class="fixed_header_scrollable_table">\n
                  <thead>\n
                    <tr>\n<th>Cemetery</th>\n<th>Name</th>\n<th>Dates</th>\n<th>Location</th>\n</tr>\n
                  </thead>\n
                  <tbody id="searchtablebody">\n
                  </tbody>\n
                </table>`);
    }

    buildHTMLRows(): string {
        return(`<tr>\n
        <td>row 1-0</td>\n
        <td>row 1-1</td>\n
        <td>row 1-2</td>\n
        <td>row 1-3</td>\n
        </tr>\n
        <tr>\n
        <td>row 2-0</td>\n
        <td>row 2-1</td>\n
        <td>row 2-2</td>\n
        <td>row 2-3</td>\n
        </tr>\n
        <tr>\n
        <td>row 3-0</td>\n
        <td>row 3-1</td>\n
        <td>row 3-2</td>\n
        <td>row 3-3</td>\n
        </tr>\n
        <tr>\n
        <td>row 4-0</td>\n
        <td>row 4-1</td>\n
        <td>row 4-2</td>\n
        <td>row 4-3</td>\n
        </tr>\n
        <tr>\n
        <td>row 5-0</td>\n
        <td>row 5-1</td>\n
        <td>row 5-2</td>\n
        <td>row 5-3</td>\n
        </tr>\n
        <tr>\n
        <td>row 6-0</td>\n
        <td>row 6-1</td>\n
        <td>row 6-2</td>\n
        <td>row 6-3</td>\n
        </tr>\n
        <tr>\n
        <td>row 7-0</td>\n
        <td>row 7-1</td>\n
        <td>row 7-2</td>\n
        <td>row 7-3</td>\n
        </tr>\n`);
    }

    initElements() {
        this.tableElement = document.getElementById('searchtable') as HTMLTableElement;
        this.tableBodyElement = document.getElementById('searchtablebody') as HTMLTableSectionElement;
    }

    populateTable() {
        this.tableBodyElement.innerHTML = this.buildHTMLRows();
    }
}

export {PBGraveSearch};