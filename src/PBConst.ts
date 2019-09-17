//
// PBConst.ts
//
// Constants used throughout the project


class PBConst {
    static EVENTS = {
        postJSON: "PBGFPostJSON",                   // event.detail = undefined
        postJSONResponse: "PBGFPostJSONResponse",   // event.detail = note
        importGraves: "PBGFImportGraves",           // event.detail = undefined

        unload: "unload"
    }
}

export {PBConst};