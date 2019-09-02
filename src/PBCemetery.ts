// PBCemetery.ts
//
//

type LatLngLit = google.maps.LatLngLiteral;

interface Grave {
    offset: LatLngLit,  // Offset from primary landmark of cemetery
    angle: number,      // Angle from principal axis of cemetery
    size: LatLngLit,    // Size of the plot
    text: string        // Hover text
}

interface SerializableCemetery {
    location: LatLngLit,            // Marker location
    title: string,                  // Shows up when hovering over the marker
    boundaries: Array<LatLngLit>,   // The actual points of the cemetery boundary
    zoom: number,                   // For zooming in
    angle: number,                  // Angle of principle axis of the cemetery
    graves: Array<Grave>
}

interface Cemetery extends SerializableCemetery {
    marker: google.maps.Marker,
    polygon: google.maps.Polygon,
}


class PBCemetery implements Cemetery {

    location: LatLngLit;
    title: string;
    boundaries: Array<LatLngLit>;
    zoom: number;
    angle: number;
    graves: Array<Grave>
    marker: google.maps.Marker;
    polygon: google.maps.Polygon;

    constructor(public map: google.maps.Map, theSerializable: SerializableCemetery) {
        this.deSerialize(theSerializable);
        this.initBoundaryPolygon();
        this.addCemeteryMarker();
    }


    static rotatePointAroundOrigin(point: google.maps.Point, origin: google.maps.Point, angle: number) {
        // The angle is in degrees.
        // This does a simple 2D rotation of a point about an origin.
        // Before using this, it is necessary to convert the LatLngLit to Point
        let angleRad = angle * Math.PI / 180.0;
        return {
            x: Math.cos(angleRad) * (point.x - origin.x) - Math.sin(angleRad) * (point.y - origin.y) + origin.x,
            y: Math.sin(angleRad) * (point.x - origin.x) + Math.cos(angleRad) * (point.y - origin.y) + origin.y
        };
    }

    rotatePolygonAroundOrigin(polygon: google.maps.Polygon, orgPt: LatLngLit, theAngle: number): Array<LatLngLit> {
        // This function returns the coordinates of the rotated Polygon.  theAngle is in degrees.
        // The Polygons are drawn on the surface of a sphere, but rotatePointAroundOrigin is based on a 2D plane.
        // The lat & lng of the Polygon needs to be converted to 2D by way of the map projection.
        // Before we can get the projection, we need to wait for the map to dispatch the projection_changed event.
        // Found this at https://stackoverflow.com/questions/26049552/google-maps-api-rotate-rectangle
        let prj = this.map.getProjection();
        let origin = prj.fromLatLngToPoint(new google.maps.LatLng(orgPt));

        let coords = polygon.getPath().getArray().map((latLng) => {
            let point = prj.fromLatLngToPoint(latLng);
            let rotatedLatLng =  prj.fromPointToLatLng(PBCemetery.rotatePointAroundOrigin(point, origin, theAngle) as google.maps.Point);
            return {lat: rotatedLatLng.lat(), lng: rotatedLatLng.lng()};
        });
        return(coords);
    }

    initGraves(index: number) {

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
        this.polygon = new google.maps.Polygon(options);
        this.polygon.setMap(this.map);
    }


    addCemeteryMarker() {
        this.marker = new google.maps.Marker({
            position: this.location,
            map: this.map,
            title: this.title
        });
        this.marker.addListener('dblclick', (event: google.maps.MouseEvent) => {this.zoomCemetery(event)})
    }


    zoomCemetery(event: google.maps.MouseEvent) {
        this.map.setZoom(this.zoom);
        this.map.setCenter(this.marker.getPosition());
    }

    deSerialize(theSerialized: SerializableCemetery) {
        this.location = theSerialized.location;
        this.title = theSerialized.title;
        this.boundaries = theSerialized.boundaries;
        this.zoom = theSerialized.zoom;
        this.angle = theSerialized.angle;
        this.graves = theSerialized.graves;
    }

    serialize(): string {
        let theJSON = '[';
        let localSerializable: SerializableCemetery = {location: null, title: '', angle: 0, boundaries: [], zoom: 18, graves: []};
        localSerializable.location = this.location;
        localSerializable.title = this.title;
        localSerializable.boundaries = this.boundaries;
        localSerializable.zoom = this.zoom;
        localSerializable.angle = this.angle;
        localSerializable.graves = this.graves;
        theJSON += JSON.stringify(localSerializable);
        theJSON += ']';
        return(theJSON);
    }

}

export {PBCemetery, SerializableCemetery};