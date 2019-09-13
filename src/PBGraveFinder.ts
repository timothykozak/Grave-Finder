// PBCemetery.ts
//
// It draws the boundaries and places
// a marker in the center of the four parish cemeteries.  Double clicking on the
// marker will zoom to the cemetery.  Right clicking on the map will zoom out to
// show all cemeteries.
//

import {PBCemetery} from "./PBCemetery.js";
import {PBUIPanel} from "./PBUIPanel.js";
import {SerializableCemetery, SerializableGraveFinder} from "./PBInterfaces";

class PBGraveFinder implements SerializableGraveFinder {
    map: google.maps.Map;
    initialLatLng: google.maps.LatLng = new google.maps.LatLng({lat: 39.65039723409571, lng: -81.85329048579649});   // Initial position of the map

    cemeteries: Array<PBCemetery> = [];
    uiPanel: PBUIPanel;

    constructor() {
        this.initMap();
//        window.addEventListener('unload', () => { this.onUnload()});
        window.addEventListener('postJSON', () => { this.onUnload()});
        this.map.addListener('rightclick', () => {this.showAllCemeteries()});
        this.map.addListener('projection_changed', () => {this.onProjectionChanged()});
    }

    initMap() {
        // Initial view shows all cemeteries
        this.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 10,
            center: this.initialLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER
            }
        });
    }

    onProjectionChanged() {
        // Need to wait until the initial projection is set before we can do any
        // transformations of polygons in PBCemetery.
        this.loadJSON();
    }

    showAllCemeteries() {
        this.map.setZoom(10);
        this.map.setCenter(this.initialLatLng);
    }

    deSerialize(theSGF: SerializableGraveFinder) {
        this.initialLatLng = theSGF.initialLatLng;
        theSGF.cemeteries.forEach((theSC: SerializableCemetery) => {
            this.cemeteries.push(new PBCemetery(this.map, theSC));
        });
        this.uiPanel = new PBUIPanel(this.map, this.cemeteries);
    }

    loadJSON() {
        // Download the JSON file with the cemeteries and the graves.
        window.fetch("assets/cemeteries.txt").
        then((response) => {
            if (!response.ok) { // Can't get the file.
                throw new Error('Network error');
        }
            return (response.json());   // Got something.
        }).then((theJSON) => {  // Convert from JSON
            this.deSerialize(theJSON);
        }).catch((err: Error) => {
            console.log('Could not retrieve cemeteries.txt.\nError message: ' + err.message);
        })
    }

    serialize(): string {
        let theJSON = '{\n"initialLatLng":';
        theJSON += JSON.stringify(this.initialLatLng);
        theJSON += ',\n"cemeteries":[';
        this.cemeteries.forEach((cemetery, index) => {
            theJSON += cemetery.serialize();
            theJSON += (index === (this.cemeteries.length - 1)) ? ']' : ',\n';
        });
        theJSON += '\n}';
        return(theJSON);
    }

    postJSON(theJSON: string) {
        fetch('saveJSON.php', {
                credentials: 'same-origin',
                method: 'POST',
                body: theJSON,
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
            })
            .then((response) => {
                return(response.json());})
            .then((response) => {
                console.log('postJSON response: ' + response);})
            .catch((error) => {
                console.error('postJSON error: ' + error)});
    }

    onUnload() {
        let theJSON = this.serialize();
        this.postJSON(theJSON);
    }

}

export {PBGraveFinder};