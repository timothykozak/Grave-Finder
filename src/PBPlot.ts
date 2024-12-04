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
const DEFAULT_GRAVE_WIDTH = 4.0;
const DEFAULT_GRAVE_HEIGHT = 13.0;

class PBPlot implements SerializablePlot {
    // Directions are based off of the principal axis of the cemetery.
    // No matter its actual direction, for these properties
    // it is considered north.  When generating the polygons, the offset
    // from geographic north must be supplied and the angle of this
    // plot must be taken into account.
    id: number;
    northFeet: number;  // These mark the offset, in feet, from the landmark to
    eastFeet: number;   // the southwest corner of this plot
    angle: number;  // Degrees clockwise from the principal axis of the cemetery.
                    // The rotation is about the southwest corner.
    numGraves: number;  // The number of the graves that the plot contains.
                        // The plots in St. Bernard are numbered beginning at the southeast corner.
    graveWidth: number; // All graves in the plot have the same height and width and
    graveHeight: number;    // are placed side by side.
    graves: Array<PBGrave>; // Graves can be interred, reserved, unavailable or available.
                            // Available graves will be undefined.
                            // Therefore, this is probably a sparse array.
                            // Need to de/serialize the undefined graves.
    plotPolygon: google.maps.Polygon;   // Outlines the plot
    swCorner: google.maps.LatLng;   // Of the plotPolygon
    neCorner: google.maps.LatLng;
    infoWindow: google.maps.InfoWindow; // Displays info about a grave in the plot.

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
        this.graveWidth = !(theSP.graveWidth == null)  ? theSP.graveWidth : DEFAULT_GRAVE_WIDTH;
        this.graveHeight = !(theSP.graveHeight == null)  ? theSP.graveHeight : DEFAULT_GRAVE_HEIGHT;

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
        theJSON += '"graveWidth":' + JSON.stringify(this.graveWidth) + ',';
        theJSON += '"graveHeight":' + JSON.stringify(this.graveHeight) + ',';

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
        // Find the Southwest corner of the plot based on its offset
        // from the landmark and the principal axis of the cemetery.  Find
        // the rest of the corners based off of the Southwest corner and the
        // angle of the plot.  The rotation of the plot is around the
        // Southwest corner.
        let swCorner = google.maps.geometry.spherical.computeOffset(new google.maps.LatLng(this.cemeteryLandmark), this.northFeet * PBConst.METERS_PER_FOOT, this.cemeteryAxis);
        swCorner = google.maps.geometry.spherical.computeOffset(swCorner, this.eastFeet * PBConst.METERS_PER_FOOT, this.cemeteryAxis + 90);
        let seCorner = google.maps.geometry.spherical.computeOffset(swCorner, this.graveWidth * this.numGraves * PBConst.METERS_PER_FOOT, totalAngle);
        let neCorner = google.maps.geometry.spherical.computeOffset(seCorner, this.graveHeight * PBConst.METERS_PER_FOOT, totalAngle + 90);
        let nwCorner = google.maps.geometry.spherical.computeOffset(neCorner, this.graveWidth * this.numGraves * PBConst.METERS_PER_FOOT, totalAngle + 180);

        thePath.push(swCorner);
        thePath.push(seCorner);
        thePath.push(neCorner);
        thePath.push(nwCorner);
        theOptions.paths = thePath; // The polygon closes itself.

        this.swCorner = swCorner;
        this.neCorner = neCorner;

        return(new google.maps.Polygon(theOptions));
    }

    generatePathToGrave(graveIndex: number) : google.maps.LatLng[] {
        // Determines the path to the grave from the cemetery landmark
        // by traveling directly cemetery north to northLatLng and then
        // traveling directly cemetery east to eastLatLng.

        // First we need to find the LatLng of the center of the grave.
        graveIndex = ((graveIndex < 0) || (graveIndex >= this.numGraves)) ? 0 : graveIndex;
        // Starting from the southwest corner, move to the correct graveNum
        let graveLatLng : google.maps.LatLng = google.maps.geometry.spherical.computeOffset(
            this.swCorner,
            ((this.numGraves - graveIndex - 0.5) * this.graveWidth * PBConst.METERS_PER_FOOT),
            (this.cemeteryAxis + this.angle + 90));
        // Now move to the middle of the height
        graveLatLng = google.maps.geometry.spherical.computeOffset(
            graveLatLng,
            (0.5 * this.graveHeight * PBConst.METERS_PER_FOOT),
            (this.cemeteryAxis + this.angle - 180));

        // Knowing the distance between the landmark and the grave, we can calculate the angle from
        // cemetery north and then determine the LatLng needed to travel directly cemetery north
        let hypotenuse : number = google.maps.geometry.spherical.computeDistanceBetween(this.cemeteryLandmark, graveLatLng);
        let angle : number = google.maps.geometry.spherical.computeHeading(this.cemeteryLandmark, graveLatLng) - this.cemeteryAxis;
        let leg : number = Math.cos(angle * PBConst.RADIANS_PER_DEGREE) * hypotenuse;
        let northLatLng : google.maps.LatLng = google.maps.geometry.spherical.computeOffset(this.cemeteryLandmark, leg, this.cemeteryAxis);

        return([northLatLng, graveLatLng]);
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
        // Only want to place the infoWindow in the center of the plot,
        // but interpolate has a lower limit of about 10 ft.  The following
        // just makes the line longer by 10 meters on each end and then
        // finds the midpoint.
        let theHeading = google.maps.geometry.spherical.computeHeading(this.swCorner, this.neCorner);
        let extendedSWCorner = google.maps.geometry.spherical.computeOffset(this.swCorner, 10, theHeading + 180);
        let extendedNECorner = google.maps.geometry.spherical.computeOffset(this.neCorner, 10, theHeading);
        let infoLatLng = google.maps.geometry.spherical.interpolate(extendedSWCorner, extendedNECorner, 0.5);

        this.infoWindow = new google.maps.InfoWindow({ content: '', position: infoLatLng });
        this.setInfoWindowContents();
    }

    onPlotClick(event: google.maps.PolyMouseEvent) {
        window.dispatchEvent(new CustomEvent(PBConst.EVENTS.showPlotInfo, {detail: {id: this.id}}));
        this.setInfoWindowContents();
        this.infoWindow.open(this.map);
    }
}

export {PBPlot};