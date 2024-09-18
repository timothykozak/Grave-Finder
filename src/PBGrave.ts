// PBGrave.ts
//
// An individual grave.  Does not know where it is located.
// Can be owned by either a cemetery or a plot.

import {SerializableGrave, GraveState, AppOptions} from "./PBInterfaces.js";

class PBGrave implements SerializableGrave {
    name: string;   // Name of interred, or owner if not yet used
    dates: string;  // Birth and death dates.  Unused if not interred.
    state: GraveState;  // Use GraveState enum
    validGrave: boolean;
    sortName: string;   // Used by a sort routine, so last name comes
                        // before first name.

    constructor(theSG: SerializableGrave) {
        this.deSerialize(theSG);
    }

    deSerialize(theSG: SerializableGrave) {
        this.validGrave = true;
        this.name = !(theSG.name == null)  ? theSG.name : '';
        this.dates = !(theSG.dates == null)  ? theSG.dates : '';
        this.state = !(theSG.state == null) ? theSG.state : GraveState.Interred;
        this.updateSortName();
        if ((this.name.length + this.dates.length) == 0)    // Nothing in this grave
            this.validGrave = false;
    }

    serialize(padding: string): string {
        let theJSON = '\n' + padding + '{';
        theJSON += '"name":' + JSON.stringify(this.name) + ', ';
        theJSON += '"dates":' + JSON.stringify(this.dates) + ', ';
        theJSON += '"state":' + JSON.stringify(this.state);
        theJSON += '}';
        return(theJSON);
    }

    textMatch(theText: string): boolean {
        // Return true if theText matches any part of name.
        theText.toLowerCase();
        let totalTextToSearch: string = this.name;
        return(totalTextToSearch.toLowerCase().includes(theText));
    }

    stateMatch(theOptions: AppOptions): boolean {
        // Return true if this state is to be displayed.
        let matches: boolean = false;
        switch(this.state){
            case GraveState.Interred:
                matches = theOptions.ShowInterred;
                break;
            case GraveState.Reserved:
                matches = theOptions.ShowReserved;
                break;
            case GraveState.Unavailable:
                matches = theOptions.ShowUnavailable;
                break;
            case GraveState.Unassigned:
                matches = theOptions.ShowUnassigned;
                break;
        }
        return(matches);
    }

    updateSortName() {
        // The names are saved as First Name Last Name.
        // For sorting we want Last Name First Name.
        // Middle names and suffixes have to be skipped over.
        // e.g. Charles D. Slavin, Jr => Slavin Charles D. Slavin, Jr
        let nameArray = this.name.split(' ');
        if (nameArray.length > 0) {
            let lastName = nameArray[nameArray.length - 1].toUpperCase();
            if (((lastName == 'JR') || (lastName == 'SR')) &&
                (nameArray.length > 1)) {
                lastName = nameArray[nameArray.length - 2].toUpperCase();
                lastName = lastName.slice(0, lastName.length - 1);
            }
            this.sortName = lastName + ' ' + this.name.toUpperCase();   // The last name is still on the end
                                                    // but it doesn't matter for the sort.
        }
    }

    static getDatesByState(theDates: string, theState: GraveState): string {
        let stateText = [theDates, "Reserved", "Unavailable", "Unassigned"];
        return((theState <= GraveState.Unassigned) ? stateText[theState] : theDates);
    }

    static getNameByState(theName: string, theState: GraveState) : string {
        return((theState == GraveState.Unavailable) ? "Unavailable" : theName);
    }

}

export {PBGrave};