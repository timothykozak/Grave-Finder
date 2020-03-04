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
    cemeteryDescription: string;    // Shows up when hovering over the cemetery
    landmarkDescription: string;    // Shows up in the graveInfoWindow
    northDescription: string;    // Shows up in the graveInfoWindow
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
    directionsToGrave: google.maps.Polyline;  // Directions to the selected grave from the landmark
    graveMarker: google.maps.Marker;    // A marker icon at the end of the directionsToGrave
    graveInfoWindow: google.maps.InfoWindow;    // Displays information about the selected grave
    boundingRectangle: google.maps.LatLngBounds;    // A rectangle that completely contains the cemtery boundaries
    visible: boolean;   // At least part of the cemetery is in the current viewport
    plotsVisible: boolean = false; // Show the plot polygons
    gravesVisible: boolean = false; // Show the grave polygons
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
        this.graveMarker.addListener('click', (event: MouseEvent) => {this.graveInfoWindow.open(this.map);});
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

    initDirectionsToGrave() {
        // Create a marker, an empty polyline and an infowindow that is used for
        // showing the directions to the selected grave.
        let polyLineOptions: google.maps.PolylineOptions = {
            // The path will be added when the grave is selected
            map: this.map,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 3,
        };
        this.directionsToGrave = new google.maps.Polyline(polyLineOptions);

        let infoWindowOptions: google.maps.InfoWindowOptions = { content: '' };
        this.graveInfoWindow = new google.maps.InfoWindow(infoWindowOptions);

        this.graveMarker = new google.maps.Marker({
                                icon: 'http://stjamesmcconnelsville.org/cemeteries/assets/headstone.png',
                                visible: false,
                                map: this.map});
    }

    updatePathToGrave(graveInfo: GraveInfo): google.maps.LatLng {
        // Generate the new path and return latlng of the grave.
        // Note that plot.northFeet is relative to the primary
        // axis of the cemetery and is unrelated to actual north.
        // This does not take into account the angle of the plot
        let thePlot = this.plots[graveInfo.plotIndex];
        let thePath: Array<google.maps.LatLng> = [];
        let northLatLng = google.maps.geometry.spherical.computeOffset(
            new google.maps.LatLng(this.location),
            thePlot.northFeet * PBConst.METERS_PER_FOOT, this.angle);
        let eastLatLng = google.maps.geometry.spherical.computeOffset(
            northLatLng,
            thePlot.eastFeet * PBConst.METERS_PER_FOOT, this.angle + 90);
        thePath.push(new google.maps.LatLng(this.location));    // Starts at landmark
        thePath.push(northLatLng);
        thePath.push(eastLatLng);
        this.directionsToGrave.setPath(thePath);
        return(eastLatLng);
    }

    generateWalkingDirectionsToGrave(thePlot: PBPlot): string {
        let turnRight = (thePlot.eastFeet >= 0);
        turnRight = (thePlot.northFeet >= 0) ? turnRight : !turnRight;
        let theDirections = `From the ${this.landmarkDescription}, walk about ${Math.abs(thePlot.northFeet)} feet
                            ${(thePlot.northFeet < 0) ? 'away from' : 'toward'} the ${this.northDescription},
                            then turn ${(turnRight) ? 'right' : 'left'} and walk about ${Math.abs(thePlot.eastFeet)} feet.`;
     return(theDirections);
    }

    updateGraveInfoWindow(graveInfo: GraveInfo, theLatLng: google.maps.LatLng) {
        // Reposition the window and update the contents.
        this.graveInfoWindow.setPosition(theLatLng);
        let thePlot = this.plots[graveInfo.plotIndex];
        let theGrave = thePlot.graves[graveInfo.graveIndex];
        let infoHTML = `<div style="font-size: 16px;">
                            ${theGrave.name}<br>
                            ${theGrave.dates}<br>
                            Plot #${graveInfo.plotIndex + 1}, Grave #${graveInfo.graveIndex + 1}<br>
                            ${this.generateWalkingDirectionsToGrave(thePlot)}
                        </div>`;
        this.graveInfoWindow.setContent(infoHTML);
    }

    showDirectionsToGrave(graveInfo: GraveInfo) {
        // Show the directions to the grave from the landmark.
        if (graveInfo.plotIndex != PBConst.INVALID_PLOT) {
            let markerLatLng = this.updatePathToGrave(graveInfo);
            this.directionsToGrave.setVisible(true);

            this.graveMarker.setPosition(markerLatLng);
            this.graveMarker.setVisible(true);

            this.updateGraveInfoWindow(graveInfo, markerLatLng);
            this.graveInfoWindow.close();
        }
    }

    hideDirectionsToGrave() {
        this.directionsToGrave.setVisible(false);
        this.graveMarker.setVisible(false);
        this.graveInfoWindow.close();
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