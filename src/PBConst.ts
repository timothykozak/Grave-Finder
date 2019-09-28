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
        addGrave: 'PBGFAddGrave',                   // event.detail = undefined
        deleteGrave: 'PBGFDeleteGrave',             // event.detail = undefined
        isDirty: 'PBGFIsDirty',                     // event.detail = undefined

        unload: 'unload'
    }
}

export {PBConst};