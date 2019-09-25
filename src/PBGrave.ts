// PBGrave.ts
//
//

import {LatLngLit, SerializableGrave} from "./PBInterfaces.js";

const DEFAULT_OFFSET: LatLngLit = {lat: 0, lng: 0};
const DEFAULT_SIZE: LatLngLit = {lat: 0, lng: 0};

class PBGrave implements SerializableGrave {


    offset: LatLngLit;
    angle: number;
    size: LatLngLit;
    name: string;
    dates: string;
    validGrave: boolean;


    constructor(public map: google.maps.Map, theSG: SerializableGrave) {
        this.deSerialize(theSG);
    }

    deSerialize(theSG: SerializableGrave) {
        this.validGrave = true;
        this.offset = !(theSG.offset == null) ? theSG.offset : DEFAULT_OFFSET;
        this.angle = !(theSG.angle == null)  ? theSG.angle : 0;
        this.size = !(theSG.size == null)  ? theSG.size : DEFAULT_SIZE;
        this.name = !(theSG.name == null)  ? theSG.name : '';
        this.dates = !(theSG.dates == null)  ? theSG.dates : '';
        if ((this.name.length + this.dates.length) == 0)
            this.validGrave = false;
    }

    serialize(): string {
        let theJSON = '\n      {';
        theJSON += '"name":' + JSON.stringify(this.name) + ', ';
        theJSON += '"dates":' + JSON.stringify(this.dates) + ', ';
        theJSON += '"offset":' + JSON.stringify(this.offset) + ', ';
        theJSON += '"size":' + JSON.stringify(this.size) + ', ';
        theJSON += '"angle":' + JSON.stringify(this.angle) + ' ';
        theJSON += '}';
        return(theJSON);
    }

    textMatch(theText: string): boolean {
        theText.toLowerCase();
        let totalTextToSearch: string = this.name + this.dates;
        totalTextToSearch.toLowerCase();
        return(totalTextToSearch.includes(theText));
    }

    getText() {
        let totalTextToSearch: string = this.name + this.dates;
        totalTextToSearch.toLowerCase();
        return(totalTextToSearch);
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
            let rotatedLatLng =  prj.fromPointToLatLng(PBGrave.rotatePointAroundOrigin(point, origin, theAngle) as google.maps.Point);
            return {lat: rotatedLatLng.lat(), lng: rotatedLatLng.lng()};
        });
        return(coords);
    }
}

export {PBGrave, SerializableGrave};