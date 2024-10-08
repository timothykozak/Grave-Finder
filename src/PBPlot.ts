// PBPlot.ts
//
// This class describes a section of a cemetery
// with one or more places for a grave.

import {PBGrave} from './PBGrave.js';
import {GraveInfo, GraveState, SerializablePlot} from './PBInterfaces.js';
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
    eastFeet: number;   // the north-west corner of this plot
    angle: number;  // Degrees clockwise from the principal axis of the cemetery.
    numGraves: number;  // The number of the graves that the plot contains.
    graves: Array<PBGrave>; // Graves can be interred, reserved, unavailable or available.
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
                this.graves[index] = new PBGrave(theSP.graves[index]);
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
                theGraveInfos.push({cemeteryIndex: cemeteryIndex, plotIndex: this.id - 1, graveIndex: index, theGrave: this.graves[index]})
        }
        return(theGraveInfos);
    }

    deleteGrave(theGraveInfo: GraveInfo) {
        if ((theGraveInfo.plotIndex == (this.id - 1)) &&
            (theGraveInfo.graveIndex < this.graves.length) &&
            (theGraveInfo.graveIndex >= 0)) {
            this.graves[theGraveInfo.graveIndex] = null;    // Using splice will change the length of the array
        }
    }

    generatePlotPolygon(): google.maps.Polygon {
        // google.maps.Rectangle is always aligned to true north,
        // therefore must use google.maps.Polygon.
        let theOptions: google.maps.PolygonOptions = {map: this.map, strokeColor: 'black', strokeWeight: 1, fillColor: 'green', visible: false};
        let totalAngle = this.cemeteryAxis + this.angle + 90;

        let thePath: Array<google.maps.LatLng> = [];
        const GRAVE_WIDTH = 4.0;    // Probably need to include the grave dimensions
                                    // in GraveInterface.
        const GRAVE_HEIGHT = 13.0;  // This changes to 12
        // Find the upper left corner of the plot based on its offset
        // from the landmark and the principal axis of the cemetery.  Find
        // the rest of the corners based off of the upper left and the
        // angle of the plot.
        let upperLeft = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(this.cemeteryLandmark), this.northFeet * PBConst.METERS_PER_FOOT, this.cemeteryAxis);
        upperLeft = google.maps.geometry.spherical.computeOffset(upperLeft, this.eastFeet * PBConst.METERS_PER_FOOT, this.cemeteryAxis + 90);
        let upperRight = google.maps.geometry.spherical.computeOffset(upperLeft, GRAVE_WIDTH * this.numGraves * PBConst.METERS_PER_FOOT, totalAngle);
        let lowerRight = google.maps.geometry.spherical.computeOffset(upperRight, GRAVE_HEIGHT * PBConst.METERS_PER_FOOT, totalAngle + 90);
        let lowerLeft = google.maps.geometry.spherical.computeOffset(lowerRight, GRAVE_WIDTH * this.numGraves * PBConst.METERS_PER_FOOT, totalAngle + 180);

        thePath.push(upperLeft);
        thePath.push(upperRight);
        thePath.push(lowerRight);
        thePath.push(lowerLeft);
        theOptions.paths = thePath; // The polygon closes itself.

        // Only want to place the infoWindow in the center of the plot,
        // but interpolate has a lower limit of about 10 ft.  The following
        // just makes the line longer by 10 meters on each end and then
        // finds the midpoint.
        let theHeading = google.maps.geometry.spherical.computeHeading(upperLeft, lowerRight);
        let newUpperLeft = google.maps.geometry.spherical.computeOffset(upperLeft, 10, theHeading + 180);
        let newLowerRight = google.maps.geometry.spherical.computeOffset(lowerRight, 10, theHeading);
        this.infoLatLng = google.maps.geometry.spherical.interpolate(newUpperLeft, newLowerRight, 0.5);

        return(new google.maps.Polygon(theOptions));
    }

    setInfoWindowContents() {
        let infoHTML = `<div style="font-size: 16px;">Plot #${this.id}</div>`;
        for (let index = 0; index < this.graves.length; index++) {
            let theGrave = this.graves[index];
            infoHTML += `<div>${index + 1}: `;
            if (theGrave) {
                switch (theGrave.state) {
                    case GraveState.Interred:
                        infoHTML += theGrave.name;
                        break;
                    case GraveState.Reserved:
                        infoHTML += 'Reserved';
                        break;
                    case GraveState.Unavailable:
                        infoHTML += 'Unavailable';
                        break;
                    default:
                        infoHTML += '';
                }
            }
            else
                {infoHTML += 'empty'}
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