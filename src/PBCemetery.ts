// PBCemetery.ts
//
//  This class represents a cemetery.  It contains all of the information
//  needed to define the cemetery and the included graves.
//  The SerializableCemetery interface is both serialized and deserialized
//  by this class.

import {LatLngLit, SerializableCemetery} from "./PBInterfaces.js";
import {PBGrave} from "./PBGrave.js";

class PBCemetery implements SerializableCemetery {

    // Serializable properties
    location: LatLngLit;
    title: string;
    description: string;
    boundaries: Array<LatLngLit>;
    zoom: number;
    angle: number;
    graves: Array<PBGrave> = [];

    // Not serialized properties
    landmark: google.maps.Marker; // A marker that indicates the landmark from which all graves are measured
    outline: google.maps.Polygon;   // The boundaries of the cemetery
    infoWindow: google.maps.InfoWindow; // Displays information about the cemetery
    boundingRectangle: google.maps.LatLngBounds;    // A rectangle that completely contains the cemtery boundaries
    visible: boolean;

    constructor(public map: google.maps.Map, theSerializable: SerializableCemetery) {
        this.deSerialize(theSerializable);
        this.initBoundaryPolygon();
        this.addCemeteryMarker();
        this.addInfoWindow();
        this.map.addListener("bounds_changed", () => {this.onBoundsChanged();})
    }

    addGraves(theGrave: PBGrave) {
        this.graves.push(theGrave);
    }

    addInfoWindow() {
        let infoText = this.description + "  There are " + this.graves.length + " graves."
        this.infoWindow = new google.maps.InfoWindow({ content: infoText });
    }

    onMouseOver(event: google.maps.PolyMouseEvent) {
        this.infoWindow.open(this.map, this.landmark);
    }

    onMouseOut(event: google.maps.PolyMouseEvent) {
        this.infoWindow.close();
    }

    onBoundsChanged() {
        // The bounds of the map viewport has changed.
        // Check if any part of the bounding rectangle
        // is visible.
        this.visible = this.map.getBounds().intersects(this.boundingRectangle);
        this.showGraves();
    }

    showGraves() {
        if (this.visible)
            this.visible;
    }

    setBoundingRectangle() {
        // Build the bounding rectangle that contains all of the cemetery
        let maxLat = -90;
        let minLat = 90;
        let maxLng = -180;
        let minLng = 180;
        this.boundaries.forEach((theLatLng: LatLngLit) => {
            maxLat = (theLatLng.lat > maxLat) ? theLatLng.lat : maxLat;
            minLat = (theLatLng.lat < minLat) ? theLatLng.lat : maxLat;
            maxLng = (theLatLng.lat > maxLng) ? theLatLng.lat : maxLng;
            minLng = (theLatLng.lat < minLng) ? theLatLng.lat : maxLng;
        });
        this.boundingRectangle = new google.maps.LatLngBounds({lat: minLat, lng: maxLng}, {lat: maxLat, lng: minLng});
    }

    initBoundaryPolygon() {
        // Options for the boundary polygon.
        let options: google.maps.PolygonOptions = {
            paths: [],
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            //editable: true
        };

        // Populate the cemetery boundary polygon.
        options.paths = this.boundaries;
        this.outline = new google.maps.Polygon(options);
        this.setBoundingRectangle();
        this.outline.setMap(this.map);
        this.outline.addListener('mouseover', (event) => {this.onMouseOver(event);})
        this.outline.addListener('mouseout', (event) => {this.onMouseOut(event);})
    }


    addCemeteryMarker() {
        this.landmark = new google.maps.Marker({
            position: this.location,
            map: this.map,
            title: this.title
        });
        this.landmark.addListener('dblclick', (event: google.maps.MouseEvent) => {this.zoomCemetery()})
    }


    zoomCemetery() {
        this.map.setZoom(this.zoom);
        this.map.setCenter(this.landmark.getPosition());
    }

    deSerialize(theSerialized: SerializableCemetery) {
        this.location = theSerialized.location;
        this.title = theSerialized.title;
        this.description = theSerialized.description;
        this.boundaries = theSerialized.boundaries;
        this.zoom = theSerialized.zoom;
        this.angle = theSerialized.angle;
        this.graves = [];
        theSerialized.graves.forEach((grave) => {
            this.addGraves(new PBGrave(this.map, grave));
        })
    }

    serialize(): string {
        let theJSON = '\n{';    // Open up the cemetery object.
        theJSON += '    "location":' + JSON.stringify(this.location) + ',\n';
        theJSON += '    "title":' + JSON.stringify(this.title) + ',\n';
        theJSON += '    "description":' + JSON.stringify(this.title) + ',\n';
        theJSON += '    "boundaries":' + JSON.stringify(this.boundaries) + ',\n';
        theJSON += '    "zoom":' + JSON.stringify(this.zoom) + ',\n';
        theJSON += '    "angle":' + JSON.stringify(this.angle) + ',\n';
        theJSON += '    "graves":[';    // Open up the grave array.
        this.graves.forEach((theGrave: PBGrave, index: number) => {
            theJSON += theGrave.serialize();
            theJSON += (index == (this.graves.length - 1)) ? '' : ',';
        });
        theJSON += ']\n';   // Finish up the grave array.
        theJSON += '}';     // Finish up the cemetery object.
        return(theJSON);
    }
}

export {PBCemetery};