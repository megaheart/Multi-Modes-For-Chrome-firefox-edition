/// <reference path="WebsiteListBinding.ts" />
/// <reference path="Mode.ts" />
/// <reference path="Storage.ts" />
/// <reference path="ModeBinding.ts" />

// Logic of #create-new-mode-panel
class CreateNewModeLogic{
    private panel:HTMLDivElement;
    private titleInput:HTMLInputElement;
    private dataManager:DataManager;
    private websiteListBinding:WebsiteListBinding;
    private settingInfo:SettingInfo;
    private saveBtn:HTMLButtonElement;
    constructor(dataManager:DataManager, settingInfo:SettingInfo) {
        this.panel = document.querySelector("#create-new-mode-panel")!;
        this.titleInput = this.panel.querySelector("#new-mode-title-input")!;
        this.websiteListBinding = new WebsiteListBinding(this.panel.querySelector("ul"));
        this.saveBtn = this.panel.querySelector(".save")!;
        this.saveBtn.addEventListener("click", ()=>{this.saveButton_click();});
        this.panel.querySelector(".cancel")!.addEventListener("click", ()=>{this.cancelButton_click();});
        this.dataManager = dataManager;
        this.settingInfo = settingInfo;
        document.querySelector("#load-to-new-mode-button")!.addEventListener("click", ()=>{
            this.togglePanel();
        });
    }
    private ingoreWebsite(url:string):boolean{
        if(url === undefined) return true;
        for(let i = 0; i < this.settingInfo.ignoreWebsites.length; i++){
            if(url.includes(this.settingInfo.ignoreWebsites[i])){
                return true;
            }
        }
        return false;
    }
    private saveButton_click(){
        let mode = new Mode();
        mode.title = this.titleInput.value;
        mode.items = this.websiteListBinding.clearAllItem();
        this.dataManager.saveMode(mode);
        ModeBinding.insertNewModeAtSecondOfGroupView(mode, this.dataManager);
        this.togglePanel();
    }
    private cancelButton_click(){
        this.togglePanel();
    }
    //result: true is open, false is close
    togglePanel():boolean{
        if(this.panel.hidden){
            //chrome api load tabs
            browser.tabs.query({}).then((results)=>{
                for(let i = 0; i < results.length; i++){
                    if(this.ingoreWebsite(results[i].url!)){
                        continue;
                    }
                    this.websiteListBinding.add(new Website(results[i].title!, results[i].url!));
                }
                this.saveBtn.disabled = this.websiteListBinding.length === 0;
            }, (e) => console.log(e));
            //////////
            let div = document.createElement("div");
            div.id = "cover-background";
            div.setAttribute("style", "position:fixed; top:0; left:0; bottom: 0; right: 0; z-index:5000;");
            div.addEventListener("click", ()=>{
                this.togglePanel();
            });
            document.querySelector("body")!.appendChild(div);
            this.panel.hidden = false;
            return true;
        }
        else{
            document.querySelector("#cover-background")?.remove();
            this.reset();
            this.panel.hidden = true;
            return false;
        }
    }
    reset(){
        this.titleInput.value = "";
        this.websiteListBinding.clearAllItem();
    }
    
}