// PBCemetery.ts
//
//  This class represents a cemetery.  It contains all of the information
//  needed to define the cemetery.  The cemetery is made up of plots.
//  The plots contain the graves.  Graves that have not yet been assigned
//  to a plot are help by the cemetery.
//  The SerializableCemetery interface is both serialized and deserialized
//  by this class.

import {GraveInfo, LatLngLit, SerializableCemetery, SerializablePlot} from "./PBInterfaces.js";
import {PBGrave} from "./PBGrave.js";
import {PBPlot} from "./PBPlot.js";
import {PBConst} from "./PBConst.js";

class PBCemetery implements SerializableCemetery {
    // Serializable properties
    location: LatLngLit;    // Location of the landmark from which all plots
                            // are offset in feet along the principal axis and
                            // its orthogonal.
    name: string;
    town: string;
    description: string;    // Shows up when hovering over the cemetery
    boundaries: Array<LatLngLit>;   // The actual points of the cemetery boundary
    zoom: number;   // For zooming in to this cemetery
    angle: number;  // Degrees clockwise from north of the principal
                    // axis of the cemetery
    graves: Array<PBGrave> = [];    // Graves not yet assigned to a plot
    plots: Array<PBPlot> = [];

    // Not serialized properties
    landmark: google.maps.Marker; // A marker that indicates the landmark from which all graves are measured
    outline: google.maps.Polygon;   // The boundaries of the cemetery
    infoWindow: google.maps.InfoWindow; // Displays information about the cemetery
    boundingRectangle: google.maps.LatLngBounds;    // A rectangle that completely contains the cemtery boundaries
    visible: boolean;
    activePlotInfo: number = -1;

    constructor(public map: google.maps.Map, theSerializable: SerializableCemetery) {
        this.deSerialize(theSerializable);
        this.initBoundaryPolygon();
        this.addCemeteryMarker();
        this.addInfoWindow();
        this.map.addListener("bounds_changed", () => {this.onBoundsChanged();});
        window.addEventListener(PBConst.EVENTS.showPlotInfo, (event: CustomEvent) => {this.onShowPlotInfo(event);});
    }

    buildBeverlyPlots() {
        this.plots = [];    // Throw all plots away

        let northFeetOffset = 17.0;
        let northFeet = -227.0; // Offset from landmark for plot 1
        let eastFeetOffset = 24.0;
        let eastFeet = 24.0;

        for (let plotIndex = 0; plotIndex < 165; plotIndex++) {
            let moduloFive = plotIndex % 5;
            if (plotIndex == 55) {northFeetOffset = 16;}    // Graves change from 17 feet long to 16 feet long
            if (plotIndex == 65) {northFeet += 16;} // Gap between cemetery sections
            northFeet += (moduloFive == 0) ? northFeetOffset : 0;
            let theSG: SerializablePlot = { id: plotIndex + 1, northFeet: northFeet, eastFeet: (eastFeet - (eastFeetOffset * moduloFive)), angle: 0, numGraves: 6, graves: []};
            let thePlot = new PBPlot(this.map, theSG, this.angle, this.location);
            this.plots.push(thePlot);
        }
    }

    addGraves(theGrave: PBGrave) {
        this.graves.push(theGrave);
    }

    addPlots(thePlot: PBPlot) {
        this.plots.push(thePlot);
    }

    deleteGrave(theGraveInfo: GraveInfo) {
        if (theGraveInfo.plotIndex == PBConst.INVALID_PLOT) {
            // Not yet assigned to a plot, need to delete it from the cemetery.
            if ((theGraveInfo.graveIndex >= 0) && (theGraveInfo.graveIndex < this.graves.length)) {
                this.graves.splice(theGraveInfo.graveIndex, 1);
            }
        } else { // Need to delete it from a plot.

        }
    }

    getGraveInfos(cemeteryIndex: number): Array<GraveInfo> {
        // Need the cemeteryIndex to insert in the GraveInfo
        let theGraveInfos = [] as Array<GraveInfo>;
        this.graves.forEach((grave, index) => {
            let theGraveInfo: GraveInfo = {cemeteryIndex: cemeteryIndex, plotIndex: PBConst.INVALID_PLOT, graveIndex: index, theGrave: grave};
            theGraveInfos.push(theGraveInfo);
        });
        this.plots.forEach((plot) => {
            theGraveInfos = theGraveInfos.concat(plot.getGraveInfo(cemeteryIndex));
        });
        return(theGraveInfos);
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

    onShowPlotInfo(event: CustomEvent) {
        if ((this.activePlotInfo > 0) && (this.activePlotInfo <= this.plots.length)) {this.plots[this.activePlotInfo - 1].infoWindow.close();}
        this.activePlotInfo = event.detail.id;  // id is not 0 based
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
            visible: false
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
            title: `${this.name}, ${this.town}\nDouble click to zoom`
        });
        this.landmark.addListener('dblclick', (event: google.maps.MouseEvent) => {this.zoomCemetery()})
    }

    zoomCemetery() {
        this.map.setZoom(this.zoom);
        this.map.setCenter(this.landmark.getPosition());
    }

    deSerialize(theSerialized: SerializableCemetery) {
        this.location = theSerialized.location;
        this.name = theSerialized.name;
        this.town = theSerialized.town;
        this.description = theSerialized.description;
        this.boundaries = theSerialized.boundaries;
        this.zoom = theSerialized.zoom;
        this.angle = theSerialized.angle;
        this.graves = [];
        theSerialized.graves.forEach((grave) => {
            this.addGraves(new PBGrave(this.map, grave));
        });
        this.plots = [];
        theSerialized.plots.forEach((plot) => {
            this.addPlots(new PBPlot(this.map, plot, this.angle, this.location));
        })
    }

    serialize(): string {
        let theJSON = '\n{';    // Open up the cemetery object.
        theJSON += '    "location":' + JSON.stringify(this.location) + ',\n';
        theJSON += '    "name":' + JSON.stringify(this.name) + ',\n';
        theJSON += '    "town":' + JSON.stringify(this.town) + ',\n';
        theJSON += '    "description":' + JSON.stringify(this.description) + ',\n';
        theJSON += '    "boundaries":' + JSON.stringify(this.boundaries) + ',\n';
        theJSON += '    "zoom":' + JSON.stringify(this.zoom) + ',\n';
        theJSON += '    "angle":' + JSON.stringify(this.angle) + ',\n';

        theJSON += '    "graves":[';    // Open up the grave array.
        this.graves.forEach((theGrave: PBGrave, index: number) => {
            theJSON += theGrave.serialize('      ');
            theJSON += (index == (this.graves.length - 1)) ? '' : ',';  // No comma on the last of the array
        });
        theJSON += '],\n';   // Finish up the grave array.

        theJSON += '    "plots":[';    // Open up the plot array.
        this.plots.forEach((thePlot: PBPlot, index: number) => {
            theJSON += thePlot.serialize();
            theJSON += (index == (this.plots.length - 1)) ? '' : ',';   // No comma on the last of the array
        });
        theJSON += ']';   // Finish up the plot array.

        theJSON += '}';     // Finish up the cemetery object.
        return(theJSON);
    }
}

export {PBCemetery};