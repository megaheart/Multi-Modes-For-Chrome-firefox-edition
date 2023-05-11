/// <reference path="WebsiteListBinding.ts" />
/// <reference path="Mode.ts" />
/// <reference path="Storage.ts" />
/// <reference path="ModeOperator.ts" />

// Logic of #groups-viewer > .group
class ModeBinding{
    private static milestone:HTMLElement|null;
    private static template:HTMLTemplateElement|null;
    static settingInfo:SettingInfo;
    static modeOperator:ModeOperator;
    static insertNewModeAtSecondOfGroupView(mode:Mode, dataManager:DataManager, addAtLast?:boolean):ModeBinding{
        if(this.milestone === undefined){
            this.milestone = document.querySelector("#groups-viewer");
            this.template = document.querySelector("#group-template");
        }
        let group = this.template!.content.firstElementChild!.cloneNode(true) as HTMLDivElement;
        group.id = "m-" + mode.id;
        let modeBinding = new ModeBinding(dataManager);
        //modeBinding.group = group;
        modeBinding.websiteListBinding = new WebsiteListBinding(group.querySelector(".websites-area>ul"));
        modeBinding.mode = mode;
        let div = group.querySelector(".group-normal");
        div!.querySelector(".group-title")!.textContent = mode.title;
        div!.querySelector(".group-title")!.addEventListener("click", ()=>{this.modeOperator.switchModeOn(modeBinding);});
        div!.querySelector(".group-open-edit-panel")!.addEventListener("click", ()=>{modeBinding.openEditPanel();});
        div = group.querySelector(".group-editor");
        div!.querySelector(".save-and-close")!.addEventListener("click", ()=>{modeBinding.saveAndCloseEditPanel();});
        div!.querySelector(".only-close")!.addEventListener("click", ()=>{modeBinding.closeEditPanelOnly();});
        div!.querySelector(".remove")!.addEventListener("click", ()=>{modeBinding.openRemoveModePanel();});
        div!.querySelector(".import")!.addEventListener("click", ()=>{modeBinding.importWebsites();});
        div = group.querySelector(".group-delete-alert");
        div!.querySelector(".remove-ok")!.addEventListener("click", ()=>{modeBinding.removeThisMode();});
        div!.querySelector(".remove-cancel")!.addEventListener("click", ()=>{modeBinding.closeRemovePanelWithoutRemove();});

        if(addAtLast){
            this.milestone!.appendChild(group);
        }
        else{
            this.milestone!.insertBefore(group, this.milestone!.childNodes[2]);
        }
        return modeBinding;
    }
    private group:HTMLDivElement;
    private dataManager:DataManager;
    private websiteListBinding:WebsiteListBinding;
    private mode:Mode;
    constructor(dataManager:DataManager) {
        this.dataManager = dataManager;
        this.isRemoved = false;
    }
    get ModeID():string{
        return this.mode.id;
    }
    static ingoreWebsite(url:string|null|undefined):boolean{
        if(!url) return true;
        if(url === undefined) return true;
        for(let i = 0; i < ModeBinding.settingInfo.ignoreWebsites.length; i++){
            if(url.includes(ModeBinding.settingInfo.ignoreWebsites[i])){
                return true;
            }
        }
        return false;
    }
    static async closeTab(tabId:number){
        return browser.tabs.remove(tabId);
    }
    //return creating Tabs' count
    switchModeOn():number{
        console.log(`turning ON highlight ${this.mode.title} mode`);


        this.group = document.querySelector("#m-" + this.mode.id)!;

        console.log(this.group);


        this.group!.querySelector<HTMLButtonElement>("#m-" + this.mode.id + " .switch-mode-on")!.disabled = true;
        this.group!.querySelector<HTMLButtonElement>("#m-" + this.mode.id + " .import")!.disabled = true;
        document.querySelector("#m-" + this.mode.id)!.classList.add("current");

        console.log(`turned ON highlight ${this.mode.title} mode`);

        console.log(this.group);

        for(let i = 0; i < this.mode.items.length; i++){
            browser.tabs.create({url:this.mode.items[i].url});
        }


        return this.mode.items.length;
    }
    private isRemoved:boolean;
    //return: [Tabs' count before , ... tabs[i].id ...]
    async switchModeOff():Promise<number[]>{
        let tabsSync = browser.tabs.query({});

        console.log(`turning off highlight ${this.mode.title} mode`);
        
        this.group = document.querySelector("#m-" + this.mode.id)!;
        console.log(this.group);


        document.querySelector<HTMLButtonElement>("#m-" + this.mode.id + " .switch-mode-on")!.disabled = false;
        document.querySelector<HTMLButtonElement>("#m-" + this.mode.id + " .import")!.disabled = false;
        document.querySelector("#m-" + this.mode.id)!.classList.remove("current");

        console.log(`turned off highlight ${this.mode.title} mode`);

        console.log(this.group);

        let tabs = await tabsSync;
        let tab_ids:number[] = [];
        let webs:Website[]|undefined = undefined;
        tab_ids.push(tabs.length);
        if(!this.isRemoved) webs = [];
        for(let i = 0; i < tabs.length; i++){
            if(ModeBinding.ingoreWebsite(tabs[i].url)){
                continue;
            }
            webs?.push(new Website(tabs[i].title as string, tabs[i].url as string));
            tab_ids.push(tabs[i].id as number);
        }
        if(!this.isRemoved){
            this.mode.items = webs?webs:[];
            this.dataManager.saveMode(this.mode);
        }
        return tab_ids;
    }
    private openEditPanel(){
        this.group!.querySelector<HTMLInputElement>(".group-editor>.group-editor-main>.group-title-editor")!.value = this.mode.title;
        if(this.group!.classList.contains("current")){
            this.websiteListBinding.disableButtons = true;
            browser.tabs.query({}).then((results)=>{
                for(let i = 0; i < results.length; i++){
                    if(ModeBinding.ingoreWebsite(results[i].url)){
                        continue;
                    }
                    this.websiteListBinding.add(new Website(results[i].title as string, results[i].url as string));
                }
            }, e => console.log(e));
            this.group!.querySelector<HTMLButtonElement>(".websites-area .import")!.disabled = true;
        }
        else{
            this.websiteListBinding.disableButtons = false;
            this.mode.items.forEach(e=>{
                this.websiteListBinding.add(e);
            });
            this.group!.querySelector<HTMLButtonElement>(".websites-area .import")!.disabled = false;
        }
        this.group!.classList.add("editing");
    }
    private saveAndCloseEditPanel(){
        this.mode.title = this.group!.querySelector<HTMLInputElement>(".group-editor>.group-editor-main>.group-title-editor")!.value;
        this.mode.items = this.websiteListBinding.clearAllItem();
        this.group!.querySelector(".group-title")!.textContent = this.mode.title;
        this.dataManager.saveMode(this.mode);
        this.group!.classList.remove("editing");
    }
    private closeEditPanelOnly(){
        this.websiteListBinding.clearAllItem();
        this.group!.classList.remove("editing");
    }
    private openRemoveModePanel(){
        this.group!.querySelector<HTMLDivElement>(".group-delete-alert")!.hidden = false;
    }
    //Import all websites (without websites in ignoreWebsites) in browser to this mode
    private importWebsites(){ //Uncompleted
        browser.tabs.query({}).then((results)=>{
            for(let i = 0; i < results.length; i++){
                if(ModeBinding.ingoreWebsite(results[i].url)){
                    continue;
                }
                this.websiteListBinding.add(new Website(results[i].title as string, results[i].url as string));
            }
        }, e => console.log(e));
    }
    private removeThisMode(){ 
        if(this.group!.classList.contains("current")){
            this.isRemoved = true;
            ModeBinding.modeOperator.switchModeOn(undefined);
        }
        this.dataManager.removeMode(this.mode);
        this.group!.remove();
    }
    private closeRemovePanelWithoutRemove(){
        this.group!.querySelector<HTMLDivElement>(".group-delete-alert")!.hidden = true;
    }
}