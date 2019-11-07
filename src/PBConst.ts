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
        requestChangeGraveHTML: 'PBGFRequestChangeGraveHTML',   // event.detail = {cemeteryIndex: number, plotIndex: number, graveIndex: number, graveElement: HTMLSelectElement, plotElement: HTMLInputELement}

        openAddGraveUI: 'PBGFOpenAddGraveUI',       // event.detail = undefined
        closeAddGraveUI: 'PBGFCloseAddGraveUI',     // event.detail = undefined
        addGrave: 'PBGFAddGrave',                   // event.detail = undefined
        requestCemeteryNames: 'PBGFRequestCemeteryNames',   // event.detail = undefined
        cemeteryNamesResponse: 'PGGFCemeteryNamesResponse', // event.detail = {names: Array<string>}
        requestGravePlot: 'PBGFRequestGravePlot',   // event.detail = undefined
        gravePlotResponse: 'PBGFGravePlotResponse', // event.detail = {}

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

    static INVALID_PLOT = -1;
}

export {PBConst};