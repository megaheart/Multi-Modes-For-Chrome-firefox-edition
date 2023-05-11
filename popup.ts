/// <reference path="logics/CreateNewModeLogic.ts" />
/// <reference path="logics/ModeBinding.ts" />
/// <reference path="logics/SyncPanelLogic.ts" />

let dataManager = new DataManager();
let modeOperator = new ModeOperator();
async function Main() {
    let settingInfo = await dataManager.getSettingInfo();
    /// Add more ignore websites 
    settingInfo.ignoreWebsites.push("extension://");
    settingInfo.ignoreWebsites.push("about:");
    ///////////////////
    let createNewModeLogic = new CreateNewModeLogic(dataManager, settingInfo);
    ModeBinding.modeOperator = modeOperator;
    ModeBinding.settingInfo = settingInfo;
    WebsiteListBinding.template = document.querySelector("#group-website-template");
    let currentModeIdSync = modeOperator.initialize();
    let modeList = await dataManager.getAllModes();
    let currentModeId = await currentModeIdSync;
    for(var i = 0; i < modeList!.length; i++){
        let binding = ModeBinding.insertNewModeAtSecondOfGroupView(modeList![i], dataManager, true);
        if(currentModeId == modeList![i].id){
            let ele:HTMLDivElement|null = document.querySelector<HTMLDivElement>("#m-" + (await currentModeIdSync));
            ele?.classList.add("current");
            let ele1 : HTMLButtonElement|undefined|null = ele?.querySelector<HTMLButtonElement>('.switch-mode-on');
            if(ele1) ele1.disabled = true;
            modeOperator.currentModeBinding = binding;
        }
    }
    if(currentModeId === undefined){
        let ele:HTMLDivElement|null= document.querySelector<HTMLDivElement>("#default-mode");
        ele?.classList.add("current");
        let ele1 = ele!.querySelector<HTMLButtonElement>('.switch-mode-on');
        ele1!.disabled = true;
    }
    let syncPanelLogic = new SyncPanelLogic(dataManager);
    // let listAsync = browser.tabs.query({currentWindow: true});
    // let mainDiv = document.querySelector("div#main");
    
    // let list = await listAsync;
    // list.forEach(e =>{
        
    // });
}
Main();
