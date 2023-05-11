/// <reference path="Storage.ts" />
/// <reference path="ModeBinding.ts" />

//Logic of #sync-panel
class SyncPanelLogic {
    private dataManager: DataManager;
    private panel: HTMLDivElement;
    constructor(dataManager: DataManager) {
        /* this.dataManager = dataManager;
        this.panel = document.querySelector("#sync-panel");
        this.panel.querySelector("#sync-push").addEventListener("click", ()=>{ this.pushButton_click(); });
        this.panel.querySelector("#sync-pull").addEventListener("click", ()=>{ this.pullButton_click(); });
        this.panel.querySelector("#sync-cancel").addEventListener("click", ()=>{ this.cancelButton_click(); });
        document.querySelector("#open-sync-panel").addEventListener("click", ()=>{
            this.togglePanel();
        }); */
    }
    private async pushButton_click() {
        let btn = this.panel.querySelector<HTMLButtonElement>("#sync-push");
        btn!.disabled = true;
        let modes = await this.dataManager.getAllModes();
        let dataSync: { [key: string]: Mode } = {};
        modes!.forEach(m => {
            dataSync[m.id] = m;
        });
        await browser.storage.sync.set({ syncModes: dataSync });
        btn!.disabled = false;
        this.togglePanel();
    }
    private pullButton_click() {
        let btn = this.panel.querySelector<HTMLButtonElement>("#sync-pull");
        btn!.disabled = true;
        browser.storage.sync.get(["syncModes"]).then(items => {
            let dataSync: { [key: string]: Mode } = items["syncModes"];
            if (dataSync) {
                let modes: Mode[] = [];
                Object.getOwnPropertyNames(dataSync).forEach(p => {
                    modes.push(dataSync[p]);
                });
                this.dataManager.importManyMode(modes);
                modes.forEach(mode => {
                    ModeBinding.insertNewModeAtSecondOfGroupView(mode, this.dataManager, true);
                });
            }
            btn!.disabled = false;
            this.togglePanel();
        }, e => console.log(e));
    }
    private cancelButton_click() {
        this.togglePanel();
    }
    togglePanel() {
        if (this.panel.hidden) {
            let div = document.createElement("div");
            div.id = "cover-background";
            div.setAttribute("style", "position:fixed; top:0; left:0; bottom: 0; right: 0; z-index:5000;");
            div.addEventListener("click", () => {
                this.togglePanel();
            });
            document.querySelector("body")!.appendChild(div);
            this.panel.hidden = false;
            return true;
        }
        else {
            document.querySelector("#cover-background")?.remove();
            this.panel.hidden = true;
            return false;
        }
    }
}
