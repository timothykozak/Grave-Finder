// PBCemetery.ts
//
// It draws the boundaries and places
// a marker in the center of the four parish cemeteries.  Double clicking on the
// marker will zoom to the cemetery.  Right clicking on the map will zoom out to
// show all cemeteries.
//

import {PBCemetery, SerializableCemetery} from "./PBCemetery.js";

class PBGraveFinder {
    map: google.maps.Map;
    initialLatLng: google.maps.LatLng = new google.maps.LatLng({lat: 39.65039723409571, lng: -81.85329048579649});   // Initial position of the map

    cemeteries: Array<PBCemetery> = [];

    constructor() {
        this.initMap();
        window.addEventListener('unload', () => { this.onUnload()});
        this.map.addListener('rightclick', () => {this.showAllCemeteries()});
        this.map.addListener('projection_changed', () => {this.projectionChanged()})
    }

    initMap() {
        // Initial view shows all cemeteries
        this.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 10,
            center: this.initialLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    }

    projectionChanged() {
        // Need to wait until the initial projection is set before we can do any
        // transformations of polygons in PBCemetery.
        this.loadJSON();
    }

    showAllCemeteries() {
        this.map.setZoom(10);
        this.map.setCenter(this.initialLatLng);
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
            theJSON.forEach((serializable: SerializableCemetery) => {
                this.cemeteries.push(new PBCemetery(this.map, serializable));
            })
        }).catch(() => {
            console.log('Could not retrieve cemeteries.txt');
        })
    }

    onUnload() {
        let theJSON = '';
        this.cemeteries.forEach((cemetery, index) => {
            theJSON += cemetery.serialize();
            theJSON += (index === (this.cemeteries.length - 1)) ? '' : ',';
        })
    }

}

export {PBGraveFinder};