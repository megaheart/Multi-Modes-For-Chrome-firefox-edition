/// <reference path="logics/Storage.ts" />
/// <reference path="logics/WebsiteListBinding.ts" />

faviconURL = (u) => "https://www.google.com/s2/favicons?domain=" + u + "&sz=16";

let dataManager = new DataManager();
let websiteListBinding = new WebsiteListBinding(document.querySelector("#edit-ingore-websites>ul"));
let settingInfo:SettingInfo;
async function Main() {
    WebsiteListBinding.template = document.querySelector("#ignore-website-template");
    settingInfo = await dataManager.getSettingInfo();
    let ignoreWebsites = settingInfo.ignoreWebsites;
    ignoreWebsites.forEach(w=>{
        websiteListBinding.add(new Website(w,w));
    });
    websiteListBinding.onListChanged = (sender, action, index, value)=>{
        let l = websiteListBinding.cloneWebsiteList();
        settingInfo.ignoreWebsites = l.map(x=>x.url);
        dataManager.saveSettingInfo(settingInfo);
    };
    document.querySelector("#import-backup")!.addEventListener("click", ImportBackup);
    document.querySelector("#export-backup")!.addEventListener("click", ExportBackup);
    let input = document.querySelector<HTMLInputElement>("#input-ingore-websites>input");
    let regexForIgnoreWebsite = /^([a-zA-Z0-9]+\.)+[a-zA-Z]{2,3}/;
    document.querySelector("#add-ingore-website")!.addEventListener("click", ()=>{
        let url = input!.value;
        if(regexForIgnoreWebsite.test(url)){
            websiteListBinding.add(new Website(url,url));
            input!.value = "";
        }
        else{
            alert(url + " is incorrect format.\nTrue format: <sub domain>.<domain name>.<top level domain>\n"
            + "Eg: www.google.com.vn, www.google.com, google.com");
        }
    });
}
async function ExportBackup() {
    let modes = await dataManager.getAllModes();
    let dataSync:Object = {
        settingInfo:settingInfo,
        modes:modes,
    }

    var downloadBtn = document.createElement("a");
    downloadBtn.href = 'data:application/json; charset=utf8, ' + encodeURIComponent(JSON.stringify(dataSync));
    let x = new Date();
    downloadBtn.download = "backup " + x.getFullYear() + "_" + (x.getMonth()+1) + "_" + x.getDate() + " " + (x.getTime()%86400000) +" of MultiMode For Chrome";
    downloadBtn.setAttribute("style", "display:none;");
    downloadBtn.click();
}
async function ImportBackup() {
    var upload:HTMLInputElement = document.createElement("input");
    upload.type = "file";
    upload.accept = "application/json";
    upload.addEventListener("change", async () => {
        let file = upload.files![0];
        let dataSync:{settingInfo:SettingInfo, modes:Mode[]} = JSON.parse(await file.text());
        upload.remove();
        try{
            if(dataSync.settingInfo === undefined) throw new Error("dataSync.settingInfo === undefined");
            if(dataSync.settingInfo.ignoreWebsites === undefined) throw new Error("dataSync.settingInfo.ignoreWebsites === undefined");
            if(dataSync.modes === undefined) throw new Error("dataSync.modes === undefined");
            dataSync.modes.forEach(mode=>{
                if(mode.title === undefined) throw new Error("mode.title === undefined");
                if((typeof mode.title) !== "string") {
                    console.log(mode.title);
                    throw new Error("mode.title is not string");
                }
                if(mode.items === undefined) throw new Error("mode.items === undefined");
                if(mode.id === undefined) throw new Error("mode.id === undefined");
            });
        }catch(error){
            console.error(error);
            console.log(dataSync);
            alert("The file you imported is not backup file of Multi Modes for browser.");
            return;
        }
        await dataManager.getAllModeIds();
        dataManager.importManyMode(dataSync.modes);
        let f = websiteListBinding.onListChanged;
        websiteListBinding.onListChanged = () => {};
        dataSync.settingInfo.ignoreWebsites.forEach(w=>{
            if(!settingInfo.ignoreWebsites.includes(w)){
                websiteListBinding.add(new Website(w, w));
            }
        });
        let l = websiteListBinding.cloneWebsiteList();
        settingInfo.ignoreWebsites = l.map(x=>x.url);
        dataManager.saveSettingInfo(settingInfo);
        websiteListBinding.onListChanged = f;
    });
    upload.click();
}
Main();