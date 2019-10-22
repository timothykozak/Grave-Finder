// PBPlot.ts
//
// This class describes a section of a cemetery
// with one or more places for a grave.

import {PBGrave} from './PBGrave.js';
import {GraveInfo, LatLngLit, SerializablePlot} from './PBInterfaces';
import {PBConst} from "./PBConst.js";

const DEFAULT_ID = -1;
const DEFAULT_ANGLE = 0.0;
const DEFAULT_FEET = 0.0;
const DEFAULT_NUM_GRAVES = 6;

class PBPlot implements SerializablePlot {
    // Directions are based off of the principal axis of the cemetery.
    // No matter its actual direction, for these properties
    // it is considered north.  When generating the polygons, the offset
    // from geographic north must be supplied and the angle of this
    // plot must be taken into account.
    id: number;
    northFeet: number;  // These mark the offset, in feet, from the landmark, to
    eastFeet: number;   // the upper left corner of this plot
    angle: number;  // Degrees clockwise from the principal axis of the cemetery.
    numGraves: number;  // The number of the graves that the plot contains.
    graves: Array<PBGrave>; // Graves can be used or purchased or available.
                            // Available graves will be undefined.
                            // Therefore, this is probably a sparse array.
                            // Need to de/serialize the undefined graves.
    plotPolygon: google.maps.Polygon;
    infoLatLng: google.maps.LatLng;
    infoWindow: google.maps.InfoWindow;

    constructor(public map: google.maps.Map, theSP: SerializablePlot, public cemeteryAxis: number, public cemeteryLandmark: google.maps.LatLngLiteral) {
        this.deSerialize(theSP);
        this.plotPolygon = this.generatePlotPolygon();
        this.addInfoWindow();
        this.initEventListeners();
    }

    initEventListeners(){
        this.plotPolygon.addListener('click', (event: google.maps.PolyMouseEvent) => {this.onPlotClick(event);})
    }

    deSerialize(theSP: SerializablePlot) {
        this.id = !(theSP.id == null) ? theSP.id : DEFAULT_ID;
        this.northFeet = !(theSP.northFeet == null) ? theSP.northFeet : DEFAULT_FEET;
        this.eastFeet = !(theSP.eastFeet == null) ? theSP.eastFeet : DEFAULT_FEET;
        this.angle = !(theSP.angle == null)  ? theSP.angle : DEFAULT_ANGLE;
        this.numGraves = !(theSP.numGraves == null)  ? theSP.numGraves : DEFAULT_NUM_GRAVES;

        this.graves = new Array(this.numGraves);    // Default to all elements undefined.
        theSP.graves.forEach((theGrave, index) => { // Only add the actual graves
            if (theGrave.hasOwnProperty('name')) {
                this.graves[index] = new PBGrave(this.map, theSP.graves[index]);
            }
        });
    }

    serialize(): string {
        let theJSON = '\n      {';  // Start the plot object.
        theJSON += '"id":' + JSON.stringify(this.id) + ', ';
        theJSON += '"northFeet":' + JSON.stringify(this.northFeet) + ', ';
        theJSON += '"eastFeet":' + JSON.stringify(this.eastFeet) + ', ';
        theJSON += '"angle":' + JSON.stringify(this.angle) + ', ';
        theJSON += '"numGraves":' + JSON.stringify(this.numGraves) + ',';


        theJSON += '\n        "graves":[';    // Open up the grave array.
        for (let index = 0; index < this.numGraves; index++) {
            // JSON does not support undefined, so the undefined items
            // in the array are passed as empty objects, and the valid
            // graves are passed as is.
            let theGrave = this.graves[index];
            if (theGrave) {
                theJSON += '    ';
                theJSON += theGrave.serialize('          ');
            } else{
                theJSON += '\n          {}';
            }
            theJSON += (index == (this.graves.length - 1)) ? '' : ',';  // No comma on the last of the array
        }
        theJSON += ']';   // Finish up the grave array.

        theJSON += '}'; // Finish the plot object.
        return(theJSON);
    }

    getGraveInfo(cemeteryIndex: number): Array<GraveInfo> {
        let theGraveInfos: Array<GraveInfo> = [];
        for (let index = 0; index < this.numGraves; index++) {
            if (this.graves[index])
                theGraveInfos.push({cemeteryIndex: cemeteryIndex, plotIndex: this.id, graveIndex: index, theGrave: this.graves[index]})
        }
        return(theGraveInfos);
    }

    generatePlotPolygon(): google.maps.Polygon {
        // google.maps.Rectangle is always aligned to true north,
        // therefore must use google.maps.Polygon.
        let theOptions: google.maps.PolygonOptions = {map: this.map, strokeColor: 'black', strokeWeight: 1, fillColor: 'green', visible: true};
        let totalAngle = this.cemeteryAxis + this.angle + 90;

        let thePath: Array<google.maps.LatLng> = [];
        const GRAVE_WIDTH = 4.0;    // Probably need to include the grave dimensions
                                    // in GraveInterface.
        const GRAVE_HEIGHT = 13.0;  // This changes to 12
        const METERS_PER_FOOT = 0.3048;
        // Find the upper left corner of the plot based on its offset
        // from the landmark and the principal axis of the cemetery.  Find
        // the rest of the corners based off of the upper left and the
        // angle of the plot.
        let upperLeft = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(this.cemeteryLandmark), this.northFeet * METERS_PER_FOOT, this.cemeteryAxis);
        upperLeft = google.maps.geometry.spherical.computeOffset(upperLeft, this.eastFeet * METERS_PER_FOOT, this.cemeteryAxis + 90);
        let upperRight = google.maps.geometry.spherical.computeOffset(upperLeft, GRAVE_WIDTH * this.numGraves * METERS_PER_FOOT, totalAngle);
        let lowerRight = google.maps.geometry.spherical.computeOffset(upperRight, GRAVE_HEIGHT * METERS_PER_FOOT, totalAngle + 90);
        let lowerLeft = google.maps.geometry.spherical.computeOffset(lowerRight, GRAVE_WIDTH * this.numGraves * METERS_PER_FOOT, totalAngle + 180);

        thePath.push(upperLeft);
        thePath.push(upperRight);
        thePath.push(lowerRight);
        thePath.push(lowerLeft);
        theOptions.paths = thePath; // The polygon closes itself.

        this.infoLatLng = google.maps.geometry.spherical.interpolate(upperLeft, lowerRight, 0.5);

        return(new google.maps.Polygon(theOptions));
    }

    setInfoWindowContents() {
        let infoHTML = `<div style="font-size: 16px;">Plot #${this.id}</div>`;
        for (let index = 0; index < this.graves.length; index++) {
            let theGrave = this.graves[index];
            infoHTML += `<div>${index + 1}: `;
            if (theGrave) {infoHTML += theGrave.name;}
            else {infoHTML += 'empty'}
            infoHTML += '</div>';
        }
        this.infoWindow.setContent(infoHTML);
    }

    addInfoWindow() {
        this.infoWindow = new google.maps.InfoWindow({ content: '', position: this.infoLatLng });
        this.setInfoWindowContents();
    }

    onPlotClick(event: google.maps.PolyMouseEvent) {
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.showPlotInfo, {detail: {id: this.id}}));
        this.setInfoWindowContents();
        this.infoWindow.open(this.map);
    }
}

export {PBPlot};