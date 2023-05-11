/// <reference path="ModeBinding.ts" />
class ModeOperator{
    currentModeBinding:ModeBinding|undefined;
    constructor() {
        this.currentModeBinding = undefined;
        document.querySelector("#return-to-default-mode")!.addEventListener("click", ()=>{
            this.switchModeOn(undefined);
        });
    }
    //return current mode id
    async initialize():Promise<string>{
        let {current_mode} = await browser.storage.local.get(["current_mode"]);
        return current_mode;
    }
    async switchModeOn(mode:ModeBinding|undefined){
        let close_tabIds:number[];
        let creatingTabsCount:number;
        if(this.currentModeBinding){
            close_tabIds = await this.currentModeBinding.switchModeOff();
        }
        else {
            close_tabIds = [];
            let tabs = await browser.tabs.query({});
            close_tabIds.push(tabs.length);
            for(let i = 0; i < tabs.length; i++){
                if(ModeBinding.ingoreWebsite(tabs[i].url)){
                    continue;
                }
                close_tabIds.push(tabs[i].id!);
            }
            let btn = document.querySelector<HTMLButtonElement>("#default-mode");
            btn!.classList.remove("current");
            btn!.disabled = false;
        }
        if(mode){
            creatingTabsCount = mode.switchModeOn();
        }
        else{
            creatingTabsCount = 0;
            let btn = document.querySelector<HTMLButtonElement>("#default-mode");
            btn!.classList.add("current");
            btn!.disabled = true;
        }
        //tabs' count when complete this function
        let tabsCountAfter = close_tabIds[0] + creatingTabsCount - close_tabIds.length + 1;
        if(tabsCountAfter === 0) browser.tabs.create({});
        for(let i = 1; i < close_tabIds.length; i++){
            browser.tabs.remove(close_tabIds[i]);
        }
        if(mode){
            browser.storage.local.set({["current_mode"]:mode.ModeID});
        }
        else{
            browser.storage.local.remove(["current_mode"]);
        }
    }
}