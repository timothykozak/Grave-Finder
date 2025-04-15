// PBCemetery.ts
//
//  This class represents a cemetery.  It contains all of the information
//  needed to define the cemetery.  The cemetery is made up of plots.
//  The plots contain the graves.  Graves that have not yet been assigned
//  to a plot are help by the cemetery.
//  The SerializableCemetery interface is both serialized and deserialized
//  by this class.

import {GraveInfo, GraveState, LatLngLit, SerializableCemetery} from "./PBInterfaces.js";
import {PBGrave} from "./PBGrave.js";
import {PBPlot} from "./PBPlot.js";
import {PBConst} from "./PBConst.js";
import {InfoBox} from "./InfoBox.js";
import PolyMouseEvent = google.maps.PolyMouseEvent;

interface DirectionsToGrave {
    // For displaying directions to the selected grave.
    northLatLng : google.maps.LatLng;    // Starting at the landmark, walk cemetery north to this location.
    eastLatLng : google.maps.LatLng;     // Then walk cemetery east to the final position of the grave.
                                         // Note that both of these values may be negative.
    northFeet : number;  // Distance to travel cemetery north
    eastFeet : number;   // and cemetery east.
    northText : string;  // Which way to walk.
    eastText : string;
    thePolyline : google.maps.Polyline;  // The lines that use the above LatLngs
    graveMarker : google.maps.Marker;   // A marker icon at the end of the directionsToGrave
    infoBox : any;  // Displays information about the selected grave
}

class PBCemetery implements SerializableCemetery {
    // Serializable properties
    location: LatLngLit;    // Location of the landmark from which all plots
                            // are offset in feet along the principal axis and
                            // its orthogonal.
    name: string;
    town: string;
    cemeteryDescription: string;    // Shows up when hovering over the cemetery
    landmarkDescription: string;    // Shows up in the graveInfoBox
    northDescription: string;    // Shows up in the graveInfoBox
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
    theDirections: DirectionsToGrave = {} as DirectionsToGrave;
    boundingRectangle: google.maps.LatLngBounds;    // A rectangle that completely contains the cemtery boundaries
    visible: boolean;   // At least part of the cemetery is in the current viewport
    plotsVisible: boolean = false; // Show the plot polygons
    activePlotInfo: number = -1;

    constructor(public map: google.maps.Map, theSerializable: SerializableCemetery) {
        this.deSerialize(theSerializable);
        this.initBoundaryPolygon();
        this.addCemeteryMarker();
        this.addInfoWindow();
        this.initDirectionsToGrave();
        this.initEventListeners();
    }

    initEventListeners(){
        this.map.addListener("bounds_changed", () => {this.onBoundsChanged();});
        window.addEventListener(PBConst.EVENTS.showPlotInfo, (event: CustomEvent) => {this.onShowPlotInfo(event);});
        window.addEventListener(PBConst.EVENTS.optionsChanged, (event: CustomEvent) => {this.onOptionsChanged(event);});
        this.theDirections.graveMarker.addListener('click', () => {this.theDirections.infoBox.open(this.map);});
    }

    addGraves(theGrave: PBGrave): number {
        // Add the grave to the end of the unassigned graves
        // array and return the index.
        return(this.graves.push(theGrave) - 1);
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
            if ((theGraveInfo.plotIndex > PBConst.INVALID_PLOT) &&
                (theGraveInfo.plotIndex < this.plots.length) &&
                (this.plots[theGraveInfo.plotIndex]))
            this.plots[theGraveInfo.plotIndex].deleteGrave(theGraveInfo);
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
        let infoText = this.cemeteryDescription;
        this.infoWindow = new google.maps.InfoWindow({ content: infoText, maxWidth: PBConst.GIB_MAX_WIDTH });
    }

    addCemeteryMarker() {
        this.landmark = new google.maps.Marker({
            position: this.location,
            map: this.map,
            title: `${this.name}, ${this.town}\nDouble click to zoom`
        });
        this.landmark.addListener('dblclick', () => {this.zoomCemetery()})
    }

    initDirectionsToGrave() {
        // Create a marker, an empty polyline and an infobox that is used for
        // showing the directions to the selected grave.
        let polyLineOptions: google.maps.PolylineOptions = {
            // The path will be added when the grave is selected
            map: this.map,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 3,
        };
        this.theDirections.thePolyline = new google.maps.Polyline(polyLineOptions);

        let infoBoxOptions = {
            boxClass: "GIB",
            boxStyle: {
                maxWidth: PBConst.GIB_MAX_WIDTH + "px",
                maxHeight: PBConst.GIB_MAX_HEIGHT + "px"
            }};
        this.theDirections.infoBox = new InfoBox(infoBoxOptions);

        this.theDirections.graveMarker = new google.maps.Marker({
            icon: {url: 'assets/redcross.png',
                   anchor: new google.maps.Point(8, 8)},
            visible: false,
            map: this.map});
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

    onOptionsChanged(event: CustomEvent) {
        this.outline.setVisible(event.detail.DrawBoundary);
        if (event.detail.DrawPlots != this.plotsVisible) {
            this.plotsVisible = event.detail.DrawPlots;
            this.plots.forEach((thePlot) => {thePlot.plotPolygon.setVisible(this.plotsVisible)});
        }
    }

    showGraves() {
        if (this.visible)
            this.visible;
    }

    updatePathToGrave(graveInfo: GraveInfo) {
        // Generate the new path, update the cemetery north and cemetery east
        // LatLngs and update the distances travelled.

        let thePlot : PBPlot = this.plots[graveInfo.plotIndex];
        let [northLatLng, eastLatLng] = thePlot.generatePathToGrave(graveInfo.graveIndex);
        this.theDirections.northLatLng = northLatLng;
        this.theDirections.eastLatLng = eastLatLng;

        let thePath: Array<google.maps.LatLng> = [];
        thePath.push(new google.maps.LatLng(this.location));    // Starts at landmark
        thePath.push(this.theDirections.northLatLng);
        thePath.push(this.theDirections.eastLatLng);
        this.theDirections.thePolyline.setPath(thePath);

        this.theDirections.northFeet = Math.round(google.maps.geometry.spherical.computeDistanceBetween(this.location, northLatLng) / PBConst.METERS_PER_FOOT);
        this.theDirections.eastFeet = Math.round(google.maps.geometry.spherical.computeDistanceBetween(northLatLng, eastLatLng) / PBConst.METERS_PER_FOOT);

        let heading : number = google.maps.geometry.spherical.computeHeading(this.location, eastLatLng);
        heading = (heading < 0) ? heading + 360 : heading;  // computeHeading returns an angle of 0 -> 180 or 0 -> -180 degrees
        heading = heading - this.angle;
        heading = (heading < 0) ? heading + 360 : heading;  // Always need a positive angle clockwise from cemetery north.

        // Take into account the four quadrants
        this.theDirections.northText = ( ((heading > 0) && (heading < 90)) ||
            ((heading > 270) && (heading < 360)) ) ? 'toward' : 'away from';
        this.theDirections.eastText = ( ((heading > 0) && (heading < 90)) ||
            ((heading > 180) && (heading < 270)) ) ? 'right' : 'left';
    }

    generateWalkingDirectionsToGrave(thePlot: PBPlot): string {
        let theDirections : string = `From the ${this.landmarkDescription}, walk about ${this.theDirections.northFeet} feet
                            ${this.theDirections.northText} the ${this.northDescription},
                            then turn ${this.theDirections.eastText} and walk about ${this.theDirections.eastFeet} feet.`;
     return(theDirections);
    }

    updateGraveInfoBoxOffset(theLatLng: google.maps.LatLng) {
        // Need to offset the infobox so that it does not
        // cover up the marker or the path to the marker.
        // computeHeading returns degrees clockwise from north
        // within the range [-180, 180].
        // For all four corner testing on St. Bernard, use:
        // Lillian Arnold (upper left @ 42/2), Alice Arnold (lower left @ 46/2),
        // Nora Arnold (upper right @ 74/4), Linda Arnold (lower right @ 146/2),
        // Jerome Arnold 42/1 doesn't offset for some reason
        let heading = google.maps.geometry.spherical.computeHeading(new google.maps.LatLng(this.location), theLatLng);
        let xOffset = (heading >= 0) ? PBConst.GIB_OFFSET : -PBConst.GIB_MAX_WIDTH - PBConst.GIB_OFFSET;
        let yOffset = ( Math.abs(heading) >= 90) ? PBConst.GIB_OFFSET : -PBConst.GIB_MAX_HEIGHT;
        this.theDirections.infoBox.setOptions({   pixelOffset: new google.maps.Size(xOffset, yOffset),
                                            maxWidth: PBConst.GIB_MAX_WIDTH});
    }

    updateGraveInfoBox(graveInfo: GraveInfo, theLatLng: google.maps.LatLng) {
        // Reposition the
        // window and update the contents.
        this.theDirections.infoBox.setPosition(theLatLng);
        let graveLocated: boolean = (graveInfo.plotIndex != PBConst.INVALID_PLOT);
        let thePlot: PBPlot;
        let theGrave: PBGrave = graveInfo.theGrave;

        let infoHTML = `<div style="font-size: 16px;">
                            <div class="GIB-name">${theGrave.name}</div>
                            ${theGrave.dates}<br>`;
        if (graveLocated) {
            infoHTML += `Plot #${graveInfo.plotIndex + 1}, Grave #${graveInfo.graveIndex + 1}<br>
                <div class="GIB-directions">Directions: </div>${this.generateWalkingDirectionsToGrave(thePlot)}`;
        } else {
            infoHTML += `<div class="GIB-directions">Directions: </div>Although the grave is in this cemetery, its precise location is uncertain.  We are working to obtain this information.`;
        }
        infoHTML += `</div>`;
        this.updateGraveInfoBoxOffset(theLatLng);
        this.theDirections.infoBox.setContent(infoHTML);
    }

    showDirectionsToGrave(graveInfo: GraveInfo) {
        // Show the directions to the grave from the landmark.  If the grave
        // has not been located, then just update the graveinfobox.
        if (graveInfo.plotIndex != PBConst.INVALID_PLOT) {
            // This grave is located
            this.updatePathToGrave(graveInfo);
            this.theDirections.thePolyline.setVisible(true);

            this.theDirections.graveMarker.setPosition(this.theDirections.eastLatLng);
            this.theDirections.graveMarker.setVisible(true);

            this.updateGraveInfoBox(graveInfo, this.theDirections.eastLatLng);
            this.theDirections.infoBox.open(this.map, this.theDirections.graveMarker);
        } else {
            // This grave is not located.
            this.updateGraveInfoBox(graveInfo, new google.maps.LatLng(this.location));
            this.theDirections.infoBox.open(this.map);
        }
    }

    hideDirectionsToGrave() {
        this.theDirections.thePolyline.setVisible(false);
        this.theDirections.graveMarker.setVisible(false);
        this.theDirections.infoBox.close();
    }

    onShowPlotInfo(event: CustomEvent) {
        if ((this.activePlotInfo > 0) && (this.activePlotInfo <= this.plots.length)) {this.plots[this.activePlotInfo - 1].infoWindow.close();}
        this.activePlotInfo = event.detail.id;  // id is not 0 based
    }

    setBoundingRectangle() {
        // Build the bounding rectangle that contains all of the cemetery.
        // This is used to determine if any of the cemetery is visible
        // in the viewport.
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
        // Using the boundaries supplied in cemeteries.txt, generate
        // a polygon that shows the boundaries of the cemetery
        let options: google.maps.PolygonOptions = { // Options for the boundary polygon.
            paths: [],
            strokeColor: '#FF00FF',
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
        this.outline.addListener('mouseover', (event : PolyMouseEvent) => {this.onMouseOver(event);});
        this.outline.addListener('mouseout', (event : PolyMouseEvent) => {this.onMouseOut(event);})
    }

    zoomCemetery() {
        this.map.setZoom(this.zoom);
        this.map.setCenter(this.landmark.getPosition());
    }

    nudgePlots(startPlot: number, endPlot: number, feetNorth: number, feetEast: number) {
        // This routine will nudge the plots North and East.  It is only invoked
        // manually from the debugger.
            for (let i = startPlot; i <= endPlot; i++) {
                let thePlot: PBPlot = this.plots[i - 1];
                thePlot.northFeet += feetNorth;
                thePlot.eastFeet += feetEast;
            }
    }

    getStats() : String {
        // Return a string with stats on graves.
        let theStats: String;
        let numInterred: number = this.graves.length;
        let numReserved: number = 0;
        let numUnavailable: number = 0;
        let numUnassigned: number = 0;

        for (let thePlot of this.plots)  {
            for (let theGrave of thePlot.graves) {  // thePlot.graves is a sparse array.
                if (theGrave) {
                    switch (theGrave.state) {
                        case GraveState.Interred:
                            numInterred++;
                            break;
                        case GraveState.Reserved:
                            numReserved++;
                            break;
                        case GraveState.Unavailable:
                            numUnavailable++;
                            break;
                        case GraveState.Unassigned:
                            numUnassigned++;
                            break;
                    }
                }
                else numUnassigned++;
            }
        }

        theStats = `There are ${numInterred} interred deceased`;
        theStats += (this.graves.length == 0) ? `.` : ` with ${this.graves.length} of them not yet located.`;
        theStats += `\nThere are ${numReserved} graves reserved and ${numUnassigned} graves available.`;
        return(theStats);
    }

    deSerialize(theSerialized: SerializableCemetery) {
        this.location = theSerialized.location;
        this.name = theSerialized.name;
        this.town = theSerialized.town;
        this.cemeteryDescription = theSerialized.cemeteryDescription;
        this.landmarkDescription = theSerialized.landmarkDescription;
        this.northDescription = theSerialized.northDescription;
        this.boundaries = theSerialized.boundaries;
        this.zoom = theSerialized.zoom;
        this.angle = theSerialized.angle;
        this.graves = [];
        theSerialized.graves.forEach((grave) => {
            this.addGraves(new PBGrave(grave));
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
        theJSON += '    "cemeteryDescription":' + JSON.stringify(this.cemeteryDescription) + ',\n';
        theJSON += '    "landmarkDescription":' + JSON.stringify(this.landmarkDescription) + ',\n';
        theJSON += '    "northDescription":' + JSON.stringify(this.northDescription) + ',\n';
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