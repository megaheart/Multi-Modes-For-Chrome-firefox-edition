/// <reference path="Mode.ts" />
/// <reference path="SettingInfo.ts" />

class DataManager{
    private s:string;
    private BASE:number;
    private modeKeyList:string[]|undefined;
    constructor() {
        this.s = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.BASE = this.s.length;
        this.modeKeyList = undefined;
    }
    async getSettingInfo():Promise<SettingInfo>{
        let {settingInfo} = await browser.storage.local.get(["settingInfo"]);
        return settingInfo ?? {ignoreWebsites:[]};
    }
    saveSettingInfo(info: SettingInfo){
        browser.storage.local.set({["settingInfo"]:info});
    }
    private generateID():string{
        let nid = Date.now();
        let id = "";
        while(nid > 0){
            id = this.s[nid%this.BASE] + id;
            nid=Math.floor(nid/this.BASE);
        }
        return id;
    }
    private async getAllKeysOfModes():Promise<string[]>{
        let {mode_id_list} = await browser.storage.local.get(["mode_id_list"]);
        return mode_id_list;
    }
    async getMode(id:string):Promise<Mode|undefined>{
        let items = await browser.storage.local.get([id]);
        if(items[id]){
            return items[id] as Mode;
        }
        else return undefined;
    }
    saveMode(mode:Mode){
        if(this.modeKeyList === undefined){
            throw new Error("Please use getAllModes() or getAllModeIds() first.");
        }
        if((mode.id == undefined) || !this.modeKeyList.includes(mode.id)){
            mode.id = "-" + this.generateID();
            this.modeKeyList.unshift(mode.id);
            browser.storage.local.set({["mode_id_list"]:this.modeKeyList});
        }
        browser.storage.local.set({[mode.id]: mode});
    }
    importManyMode(modes:Mode[]){
        for(let i = 0; i < modes.length; i++){
            if(this.modeKeyList === undefined){
                throw new Error("Please use getAllModes() first.");
            }
            if(!this.modeKeyList.includes(modes[i].id)){
                this.modeKeyList.push(modes[i].id);
                browser.storage.local.set({[modes[i].id]: modes[i]});
            }
        }
        browser.storage.local.set({["mode_id_list"]:this.modeKeyList});
    }
    removeMode(mode:Mode){
        let index = this.modeKeyList?.indexOf(mode.id);
        if(index !== null && index !== undefined && index >= 0){
            //console.log(this.modeKeyList);
            this.modeKeyList?.splice(index, 1);
            //console.log(this.modeKeyList);
            browser.storage.local.set({["mode_id_list"]:this.modeKeyList});
            browser.storage.local.remove([mode.id]);
        }
    }
    async getAllModeIds():Promise<string[]>{
        if(this.modeKeyList === undefined){
            let keys = await this.getAllKeysOfModes();
            if(keys) {
                this.modeKeyList = keys;
            }
            else this.modeKeyList = [];
        }
        return this.modeKeyList;
    }
    async getAllModes():Promise<Mode[]|undefined>{
        if(this.modeKeyList === undefined){
            await this.getAllModeIds();
        }
        if(!this.modeKeyList?.length || this.modeKeyList?.length === 0) return undefined;
        let keys = this.modeKeyList;
        let modes:Mode[] = [];
        for(var i = 0; i < keys.length; i++){
            let mode = await this.getMode(keys[i]);
            if(!mode) {
                this.modeKeyList.splice(i,1);
                browser.storage.local.set({["mode_id_list"]:this.modeKeyList});
                i--;
                continue;
            }
            modes.push(mode);
        }
        return modes;
    }
    
}