// PBGraveFinder.ts
//
// This is the main class.  It is instantiated by the html after
// after google.maps has been downloaded.
// This class will initialize the map and download the JSON
// with the cemeteries and the graves.  It will instantiate
// the PBUI only after the cemeteries have been successfully
// deserialized.  On saving, saveJSON.php is needed on the server.
//

import {PBCemetery} from "./PBCemetery.js";
import {PBUI} from "./PBUI.js";
import {SerializableCemetery, SerializableGraveFinder} from "./PBInterfaces.js";
import {PBConst} from "./PBConst.js";
import {PBOcclusion} from "./PBOcclusion.js";

class PBGraveFinder implements SerializableGraveFinder {
    map: google.maps.Map;
    initialLatLng: google.maps.LatLng = new google.maps.LatLng({lat: 39.65039723409571, lng: -81.85329048579649});   // Initial position of the map

    cemeteries: Array<PBCemetery> = [];
    uiPanel: PBUI;

    constructor() {
        this.initMap();
        this.addEventListeners();
    }

    addEventListeners(){
        // window.addEventListener('unload', () => { this.onUnload()});
        window.addEventListener(PBConst.EVENTS.postJSON, () => { this.postJSON()});

        this.map.addListener('rightclick', () => {this.showAllCemeteries()});
        this.map.addListener('projection_changed', () => {this.onProjectionChanged()});
    }

    initMap() {
        // Set the options for the map
        this.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 10,   // Initial view shows all cemeteries
            center: this.initialLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,   // Start with standard road map
            mapTypeControl: true,   // Satellite view is available lower middle
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.BOTTOM_CENTER
            },
            streetViewControl: true,    // Street view is available lower right
            streetViewControlOptions: {
                position: google.maps.ControlPosition.BOTTOM_RIGHT
            },
            zoomControl: true,  // Zoom control is available lower right
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControl: true,    // Full screen is available lower left
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
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
        // Convert all of the data from JSON to Javascript
        this.initialLatLng = theSGF.initialLatLng;
        theSGF.cemeteries.forEach((theSC: SerializableCemetery) => {
            this.cemeteries.push(new PBCemetery(this.map, theSC));
        });
        this.uiPanel = new PBUI(this.map, this.cemeteries);
    }

    loadJSON() {
        // Download the JSON file with the cemeteries and the graves.
        // Cover the screen with theOcclusion while downloading.
        let theOcclusion = new PBOcclusion(document.getElementById('map') as HTMLDivElement);
        theOcclusion.activate('Downloading cemetery data.  Please wait.');

        window.fetch("assets/cemeteries.txt").  // Ask for the file
        then((response) => {
            if (!response.ok) { // Can't get the file.
                throw new Error('Network error');
        }
            return (response.json());   // Got something.
        }).then((theJSON) => {  // Convert from JSON
            this.deSerialize(theJSON);
            theOcclusion.deactivate();
        }).catch((err: Error) => {  // Unrecoverable error
            let theMessage = 'Could not retrieve cemeteries.txt.<br>Error message: ' + err.message;
            theOcclusion.setText(theMessage);
            theOcclusion.showOKButton();
        })
    }

    serialize(): string {
        // Convert all data from Javascript to JSON.
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

    postJSON() {
        // Save the data to the server.
        this.uiPanel.onSaveInitiated(); // Show saving occlusion
        let theJSON = this.serialize(); // Convert from Javascript to JSON.
        fetch('saveJSON.php', { // saveJSON.php will accept the JSON, save it on the server and return a result.
                credentials: 'same-origin',
                method: 'POST',
                body: theJSON,
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
            })
            .then((response) => {   // The response from saveJSON.php
                if (response.ok) {
                    return (response.text());
                }
                throw new Error('Network problem: ' + response.status + ' (' + response.statusText + ')'); })
            .then((response) => {   // The text of the request
                console.log('postJSON response: ' + response);
                return(JSON.parse(response)); })
            .then((response) => {
                console.log('postJSON object: ' + JSON.stringify(response));
                window.dispatchEvent(new CustomEvent(PBConst.EVENTS.postJSONResponse, {detail: response}));
            })
            .catch((error) => { // Unrecoverable error
                console.error('postJSON ' + error);
                window.dispatchEvent(new CustomEvent(PBConst.EVENTS.postJSONResponse, {detail: {success: false, message: error}}));
            });
    }

}

export {PBGraveFinder};