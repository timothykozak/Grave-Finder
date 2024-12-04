//
// PBConst.ts
//
// Constants used throughout the project


class PBConst {
    static EVENTS = {
        postJSON: 'PBGFPostJSON',                   // event.detail = undefined
        postJSONResponse: 'PBGFPostJSONResponse',   // event.detail = {success: boolean, message: string}
        importGraves: 'PBGFImportGraves',           // event.detail = undefined
        requestPassword: 'PBGFRequestPassword',     // event.detail = undefined
        closeEditControls: 'PBGFCloseEditControls', // event.detail = undefined
        selectGraveRow: 'PBGFSelectGraveRow',       // event.detail = {index: number}
        unselectGraveRow: 'PBGFUnselectGraveRow',   // event.detail = undefined
        changePlotNumber: 'PBGFChangePlotNumber',   // event.detail = undefined
        changeGraveNumber: 'PBGFChangeGraveNumber', // event.detail = undefined
        requestChangeGraveHTML: 'PBGFRequestChangeGraveHTML',   // event.detail = RequestChangeGraveHTML

        openAddGraveUI: 'PBGFOpenAddGraveUI',       // event.detail = undefined
        closeAddGraveUI: 'PBGFCloseAddGraveUI',     // event.detail = undefined
        addGrave: 'PBGFAddGrave',                   // event.detail = {graveInfo: GraveInfo}
        requestCemeteryNames: 'PBGFRequestCemeteryNames',   // event.detail = undefined
        cemeteryNamesResponse: 'PGGFCemeteryNamesResponse', // event.detail = {names: Array<string>}
        requestGravePlot: 'PBGFRequestGravePlot',   // event.detail = undefined
        gravePlotResponse: 'PBGFGravePlotResponse', // event.detail = {}

        openOptions: 'PBGFOpenOptions',             // event.detail = undefined
        closeOptions: 'PBGFCloseOptions',             // event.detail = undefined
        optionsChanged: 'PBGFOptionsChanged',             // event.detail = {options: Options}
        openHelp: 'PBGFOpenHelp',                   // event.detail = undefined
        closeHelp: 'PBGFCloseHelp',                   // event.detail = undefined

        printReport: 'PBGFPrintReport',             // event.detail = undefined

        deleteGrave: 'PBGFDeleteGrave',             // event.detail = undefined
        isDirty: 'PBGFIsDirty',                     // event.detail = undefined
        showPlotInfo: 'PBGFShowPlotInfo',           // event.detail = {id: number}


        unload: 'unload'                            // event.detail = undefined
    };

    static GRAVE = {
        width: 4,
        length: 12
    };

    static METERS_PER_FOOT = 0.3048;    // This is exact.
    static RADIANS_PER_DEGREE = Math.PI / 180;

    static INVALID_PLOT = -1;

    // Grave InfoBox
    static GIB_MAX_WIDTH = 200;
    static GIB_MAX_HEIGHT = 200;
    static GIB_OFFSET = 15;
}

export {PBConst};