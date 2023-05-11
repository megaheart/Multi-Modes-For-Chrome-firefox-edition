var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Website {
    constructor(title, url) {
        this.title = title;
        this.url = url;
    }
}
function faviconURLByChromeAPI(u) {
    const url = new URL(browser.runtime.getURL("/icons/website-icon.png"));
    return url.toString();
}
let faviconURL = faviconURLByChromeAPI;
class WebsiteListBinding {
    constructor(uList) {
        this.items = [];
        if (uList) {
            this.uList = uList;
        }
        this._disableButtons = false;
    }
    set disableButtons(value) {
        if (this._disableButtons != value) {
            if (value) {
                this.uList.querySelectorAll("button.remove-website-from-mode").forEach(e => {
                    e.disabled = true;
                });
            }
            else {
                this.uList.querySelectorAll("button.remove-website-from-mode").forEach(e => {
                    e.disabled = false;
                });
            }
            this._disableButtons = value;
        }
    }
    getElementAt(i) {
        return this.items[i];
    }
    get length() {
        return this.items.length;
    }
    cloneWebsiteList() {
        return [...this.items];
    }
    forEach(enumirator) {
        this.items.forEach(enumirator);
    }
    generateElement(value) {
        let li = WebsiteListBinding.template.content.firstElementChild.cloneNode(true);
        li.querySelector("img.favicon").src = faviconURL(value.url);
        li.querySelector("span.website-title").textContent = value.title;
        li.querySelector("div.website-header").addEventListener("click", () => {
            browser.tabs.create({ url: value.url });
        });
        let btn = li.querySelector("button.remove-website-from-mode");
        btn.disabled = this._disableButtons;
        btn.addEventListener("click", () => {
            let index = this.items.indexOf(value);
            this.removeAt(index);
            if (this.onListChanged)
                this.onListChanged(this, "remove", index, value);
        });
        return li;
    }
    insert(index, value) {
        if (index > this.items.length || index < 0)
            throw new RangeError("Index (" + index + ") is out of range [0.." + this.length + "]");
        else if (index == this.items.length) {
            this.uList.appendChild(this.generateElement(value));
        }
        else {
            this.uList.insertBefore(this.generateElement(value), this.uList.children[index]);
        }
        this.items.splice(index, 0, value);
        if (this.onListChanged)
            this.onListChanged(this, "insert", index, value);
    }
    add(value) {
        this.uList.appendChild(this.generateElement(value));
        this.items.push(value);
        if (this.onListChanged)
            this.onListChanged(this, "insert", this.items.length - 1, value);
    }
    removeAt(index) {
        this.uList.children[index].remove();
        this.items.splice(index, 1);
    }
    clearAllItem() {
        this.uList.textContent = '';
        return this.items.splice(0, this.items.length);
    }
}
class Mode {
}
class SettingInfo {
}
class DataManager {
    constructor() {
        this.s = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.BASE = this.s.length;
        this.modeKeyList = undefined;
    }
    getSettingInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let { settingInfo } = yield browser.storage.local.get(["settingInfo"]);
            return settingInfo !== null && settingInfo !== void 0 ? settingInfo : { ignoreWebsites: [] };
        });
    }
    saveSettingInfo(info) {
        browser.storage.local.set({ ["settingInfo"]: info });
    }
    generateID() {
        let nid = Date.now();
        let id = "";
        while (nid > 0) {
            id = this.s[nid % this.BASE] + id;
            nid = Math.floor(nid / this.BASE);
        }
        return id;
    }
    getAllKeysOfModes() {
        return __awaiter(this, void 0, void 0, function* () {
            let { mode_id_list } = yield browser.storage.local.get(["mode_id_list"]);
            return mode_id_list;
        });
    }
    getMode(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = yield browser.storage.local.get([id]);
            if (items[id]) {
                return items[id];
            }
            else
                return undefined;
        });
    }
    saveMode(mode) {
        if (this.modeKeyList === undefined) {
            throw new Error("Please use getAllModes() or getAllModeIds() first.");
        }
        if ((mode.id == undefined) || !this.modeKeyList.includes(mode.id)) {
            mode.id = "-" + this.generateID();
            this.modeKeyList.unshift(mode.id);
            browser.storage.local.set({ ["mode_id_list"]: this.modeKeyList });
        }
        browser.storage.local.set({ [mode.id]: mode });
    }
    importManyMode(modes) {
        for (let i = 0; i < modes.length; i++) {
            if (this.modeKeyList === undefined) {
                throw new Error("Please use getAllModes() first.");
            }
            if (!this.modeKeyList.includes(modes[i].id)) {
                this.modeKeyList.push(modes[i].id);
                browser.storage.local.set({ [modes[i].id]: modes[i] });
            }
        }
        browser.storage.local.set({ ["mode_id_list"]: this.modeKeyList });
    }
    removeMode(mode) {
        var _a, _b;
        let index = (_a = this.modeKeyList) === null || _a === void 0 ? void 0 : _a.indexOf(mode.id);
        if (index !== null && index !== undefined && index >= 0) {
            (_b = this.modeKeyList) === null || _b === void 0 ? void 0 : _b.splice(index, 1);
            browser.storage.local.set({ ["mode_id_list"]: this.modeKeyList });
            browser.storage.local.remove([mode.id]);
        }
    }
    getAllModeIds() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.modeKeyList === undefined) {
                let keys = yield this.getAllKeysOfModes();
                if (keys) {
                    this.modeKeyList = keys;
                }
                else
                    this.modeKeyList = [];
            }
            return this.modeKeyList;
        });
    }
    getAllModes() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.modeKeyList === undefined) {
                yield this.getAllModeIds();
            }
            if (!((_a = this.modeKeyList) === null || _a === void 0 ? void 0 : _a.length) || ((_b = this.modeKeyList) === null || _b === void 0 ? void 0 : _b.length) === 0)
                return undefined;
            let keys = this.modeKeyList;
            let modes = [];
            for (var i = 0; i < keys.length; i++) {
                let mode = yield this.getMode(keys[i]);
                if (!mode) {
                    this.modeKeyList.splice(i, 1);
                    browser.storage.local.set({ ["mode_id_list"]: this.modeKeyList });
                    i--;
                    continue;
                }
                modes.push(mode);
            }
            return modes;
        });
    }
}
class ModeOperator {
    constructor() {
        this.currentModeBinding = undefined;
        document.querySelector("#return-to-default-mode").addEventListener("click", () => {
            this.switchModeOn(undefined);
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            let { current_mode } = yield browser.storage.local.get(["current_mode"]);
            return current_mode;
        });
    }
    switchModeOn(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            let close_tabIds;
            let creatingTabsCount;
            if (this.currentModeBinding) {
                close_tabIds = yield this.currentModeBinding.switchModeOff();
            }
            else {
                close_tabIds = [];
                let tabs = yield browser.tabs.query({});
                close_tabIds.push(tabs.length);
                for (let i = 0; i < tabs.length; i++) {
                    if (ModeBinding.ingoreWebsite(tabs[i].url)) {
                        continue;
                    }
                    close_tabIds.push(tabs[i].id);
                }
                let btn = document.querySelector("#default-mode");
                btn.classList.remove("current");
                btn.disabled = false;
            }
            if (mode) {
                creatingTabsCount = mode.switchModeOn();
            }
            else {
                creatingTabsCount = 0;
                let btn = document.querySelector("#default-mode");
                btn.classList.add("current");
                btn.disabled = true;
            }
            let tabsCountAfter = close_tabIds[0] + creatingTabsCount - close_tabIds.length + 1;
            if (tabsCountAfter === 0)
                browser.tabs.create({});
            for (let i = 1; i < close_tabIds.length; i++) {
                browser.tabs.remove(close_tabIds[i]);
            }
            if (mode) {
                browser.storage.local.set({ ["current_mode"]: mode.ModeID });
            }
            else {
                browser.storage.local.remove(["current_mode"]);
            }
        });
    }
}
class ModeBinding {
    static insertNewModeAtSecondOfGroupView(mode, dataManager, addAtLast) {
        if (this.milestone === undefined) {
            this.milestone = document.querySelector("#groups-viewer");
            this.template = document.querySelector("#group-template");
        }
        let group = this.template.content.firstElementChild.cloneNode(true);
        group.id = "m-" + mode.id;
        let modeBinding = new ModeBinding(dataManager);
        modeBinding.websiteListBinding = new WebsiteListBinding(group.querySelector(".websites-area>ul"));
        modeBinding.mode = mode;
        let div = group.querySelector(".group-normal");
        div.querySelector(".group-title").textContent = mode.title;
        div.querySelector(".group-title").addEventListener("click", () => { this.modeOperator.switchModeOn(modeBinding); });
        div.querySelector(".group-open-edit-panel").addEventListener("click", () => { modeBinding.openEditPanel(); });
        div = group.querySelector(".group-editor");
        div.querySelector(".save-and-close").addEventListener("click", () => { modeBinding.saveAndCloseEditPanel(); });
        div.querySelector(".only-close").addEventListener("click", () => { modeBinding.closeEditPanelOnly(); });
        div.querySelector(".remove").addEventListener("click", () => { modeBinding.openRemoveModePanel(); });
        div.querySelector(".import").addEventListener("click", () => { modeBinding.importWebsites(); });
        div = group.querySelector(".group-delete-alert");
        div.querySelector(".remove-ok").addEventListener("click", () => { modeBinding.removeThisMode(); });
        div.querySelector(".remove-cancel").addEventListener("click", () => { modeBinding.closeRemovePanelWithoutRemove(); });
        if (addAtLast) {
            this.milestone.appendChild(group);
        }
        else {
            this.milestone.insertBefore(group, this.milestone.childNodes[2]);
        }
        return modeBinding;
    }
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isRemoved = false;
    }
    get ModeID() {
        return this.mode.id;
    }
    static ingoreWebsite(url) {
        if (!url)
            return true;
        if (url === undefined)
            return true;
        for (let i = 0; i < ModeBinding.settingInfo.ignoreWebsites.length; i++) {
            if (url.includes(ModeBinding.settingInfo.ignoreWebsites[i])) {
                return true;
            }
        }
        return false;
    }
    static closeTab(tabId) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.tabs.remove(tabId);
        });
    }
    switchModeOn() {
        console.log(`turning ON highlight ${this.mode.title} mode`);
        this.group = document.querySelector("#m-" + this.mode.id);
        console.log(this.group);
        this.group.querySelector("#m-" + this.mode.id + " .switch-mode-on").disabled = true;
        this.group.querySelector("#m-" + this.mode.id + " .import").disabled = true;
        document.querySelector("#m-" + this.mode.id).classList.add("current");
        console.log(`turned ON highlight ${this.mode.title} mode`);
        console.log(this.group);
        for (let i = 0; i < this.mode.items.length; i++) {
            browser.tabs.create({ url: this.mode.items[i].url });
        }
        return this.mode.items.length;
    }
    switchModeOff() {
        return __awaiter(this, void 0, void 0, function* () {
            let tabsSync = browser.tabs.query({});
            console.log(`turning off highlight ${this.mode.title} mode`);
            this.group = document.querySelector("#m-" + this.mode.id);
            console.log(this.group);
            document.querySelector("#m-" + this.mode.id + " .switch-mode-on").disabled = false;
            document.querySelector("#m-" + this.mode.id + " .import").disabled = false;
            document.querySelector("#m-" + this.mode.id).classList.remove("current");
            console.log(`turned off highlight ${this.mode.title} mode`);
            console.log(this.group);
            let tabs = yield tabsSync;
            let tab_ids = [];
            let webs = undefined;
            tab_ids.push(tabs.length);
            if (!this.isRemoved)
                webs = [];
            for (let i = 0; i < tabs.length; i++) {
                if (ModeBinding.ingoreWebsite(tabs[i].url)) {
                    continue;
                }
                webs === null || webs === void 0 ? void 0 : webs.push(new Website(tabs[i].title, tabs[i].url));
                tab_ids.push(tabs[i].id);
            }
            if (!this.isRemoved) {
                this.mode.items = webs ? webs : [];
                this.dataManager.saveMode(this.mode);
            }
            return tab_ids;
        });
    }
    openEditPanel() {
        this.group.querySelector(".group-editor>.group-editor-main>.group-title-editor").value = this.mode.title;
        if (this.group.classList.contains("current")) {
            this.websiteListBinding.disableButtons = true;
            browser.tabs.query({}).then((results) => {
                for (let i = 0; i < results.length; i++) {
                    if (ModeBinding.ingoreWebsite(results[i].url)) {
                        continue;
                    }
                    this.websiteListBinding.add(new Website(results[i].title, results[i].url));
                }
            }, e => console.log(e));
            this.group.querySelector(".websites-area .import").disabled = true;
        }
        else {
            this.websiteListBinding.disableButtons = false;
            this.mode.items.forEach(e => {
                this.websiteListBinding.add(e);
            });
            this.group.querySelector(".websites-area .import").disabled = false;
        }
        this.group.classList.add("editing");
    }
    saveAndCloseEditPanel() {
        this.mode.title = this.group.querySelector(".group-editor>.group-editor-main>.group-title-editor").value;
        this.mode.items = this.websiteListBinding.clearAllItem();
        this.group.querySelector(".group-title").textContent = this.mode.title;
        this.dataManager.saveMode(this.mode);
        this.group.classList.remove("editing");
    }
    closeEditPanelOnly() {
        this.websiteListBinding.clearAllItem();
        this.group.classList.remove("editing");
    }
    openRemoveModePanel() {
        this.group.querySelector(".group-delete-alert").hidden = false;
    }
    importWebsites() {
        browser.tabs.query({}).then((results) => {
            for (let i = 0; i < results.length; i++) {
                if (ModeBinding.ingoreWebsite(results[i].url)) {
                    continue;
                }
                this.websiteListBinding.add(new Website(results[i].title, results[i].url));
            }
        }, e => console.log(e));
    }
    removeThisMode() {
        if (this.group.classList.contains("current")) {
            this.isRemoved = true;
            ModeBinding.modeOperator.switchModeOn(undefined);
        }
        this.dataManager.removeMode(this.mode);
        this.group.remove();
    }
    closeRemovePanelWithoutRemove() {
        this.group.querySelector(".group-delete-alert").hidden = true;
    }
}
class CreateNewModeLogic {
    constructor(dataManager, settingInfo) {
        this.panel = document.querySelector("#create-new-mode-panel");
        this.titleInput = this.panel.querySelector("#new-mode-title-input");
        this.websiteListBinding = new WebsiteListBinding(this.panel.querySelector("ul"));
        this.saveBtn = this.panel.querySelector(".save");
        this.saveBtn.addEventListener("click", () => { this.saveButton_click(); });
        this.panel.querySelector(".cancel").addEventListener("click", () => { this.cancelButton_click(); });
        this.dataManager = dataManager;
        this.settingInfo = settingInfo;
        document.querySelector("#load-to-new-mode-button").addEventListener("click", () => {
            this.togglePanel();
        });
    }
    ingoreWebsite(url) {
        if (url === undefined)
            return true;
        for (let i = 0; i < this.settingInfo.ignoreWebsites.length; i++) {
            if (url.includes(this.settingInfo.ignoreWebsites[i])) {
                return true;
            }
        }
        return false;
    }
    saveButton_click() {
        let mode = new Mode();
        mode.title = this.titleInput.value;
        mode.items = this.websiteListBinding.clearAllItem();
        this.dataManager.saveMode(mode);
        ModeBinding.insertNewModeAtSecondOfGroupView(mode, this.dataManager);
        this.togglePanel();
    }
    cancelButton_click() {
        this.togglePanel();
    }
    togglePanel() {
        var _a;
        if (this.panel.hidden) {
            browser.tabs.query({}).then((results) => {
                for (let i = 0; i < results.length; i++) {
                    if (this.ingoreWebsite(results[i].url)) {
                        continue;
                    }
                    this.websiteListBinding.add(new Website(results[i].title, results[i].url));
                }
                this.saveBtn.disabled = this.websiteListBinding.length === 0;
            }, (e) => console.log(e));
            let div = document.createElement("div");
            div.id = "cover-background";
            div.setAttribute("style", "position:fixed; top:0; left:0; bottom: 0; right: 0; z-index:5000;");
            div.addEventListener("click", () => {
                this.togglePanel();
            });
            document.querySelector("body").appendChild(div);
            this.panel.hidden = false;
            return true;
        }
        else {
            (_a = document.querySelector("#cover-background")) === null || _a === void 0 ? void 0 : _a.remove();
            this.reset();
            this.panel.hidden = true;
            return false;
        }
    }
    reset() {
        this.titleInput.value = "";
        this.websiteListBinding.clearAllItem();
    }
}
class SyncPanelLogic {
    constructor(dataManager) {
    }
    pushButton_click() {
        return __awaiter(this, void 0, void 0, function* () {
            let btn = this.panel.querySelector("#sync-push");
            btn.disabled = true;
            let modes = yield this.dataManager.getAllModes();
            let dataSync = {};
            modes.forEach(m => {
                dataSync[m.id] = m;
            });
            yield browser.storage.sync.set({ syncModes: dataSync });
            btn.disabled = false;
            this.togglePanel();
        });
    }
    pullButton_click() {
        let btn = this.panel.querySelector("#sync-pull");
        btn.disabled = true;
        browser.storage.sync.get(["syncModes"]).then(items => {
            let dataSync = items["syncModes"];
            if (dataSync) {
                let modes = [];
                Object.getOwnPropertyNames(dataSync).forEach(p => {
                    modes.push(dataSync[p]);
                });
                this.dataManager.importManyMode(modes);
                modes.forEach(mode => {
                    ModeBinding.insertNewModeAtSecondOfGroupView(mode, this.dataManager, true);
                });
            }
            btn.disabled = false;
            this.togglePanel();
        }, e => console.log(e));
    }
    cancelButton_click() {
        this.togglePanel();
    }
    togglePanel() {
        var _a;
        if (this.panel.hidden) {
            let div = document.createElement("div");
            div.id = "cover-background";
            div.setAttribute("style", "position:fixed; top:0; left:0; bottom: 0; right: 0; z-index:5000;");
            div.addEventListener("click", () => {
                this.togglePanel();
            });
            document.querySelector("body").appendChild(div);
            this.panel.hidden = false;
            return true;
        }
        else {
            (_a = document.querySelector("#cover-background")) === null || _a === void 0 ? void 0 : _a.remove();
            this.panel.hidden = true;
            return false;
        }
    }
}
let dataManager = new DataManager();
let modeOperator = new ModeOperator();
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        let settingInfo = yield dataManager.getSettingInfo();
        settingInfo.ignoreWebsites.push("extension://");
        settingInfo.ignoreWebsites.push("about:");
        let createNewModeLogic = new CreateNewModeLogic(dataManager, settingInfo);
        ModeBinding.modeOperator = modeOperator;
        ModeBinding.settingInfo = settingInfo;
        WebsiteListBinding.template = document.querySelector("#group-website-template");
        let currentModeIdSync = modeOperator.initialize();
        let modeList = yield dataManager.getAllModes();
        let currentModeId = yield currentModeIdSync;
        for (var i = 0; i < modeList.length; i++) {
            let binding = ModeBinding.insertNewModeAtSecondOfGroupView(modeList[i], dataManager, true);
            if (currentModeId == modeList[i].id) {
                let ele = document.querySelector("#m-" + (yield currentModeIdSync));
                ele === null || ele === void 0 ? void 0 : ele.classList.add("current");
                let ele1 = ele === null || ele === void 0 ? void 0 : ele.querySelector('.switch-mode-on');
                if (ele1)
                    ele1.disabled = true;
                modeOperator.currentModeBinding = binding;
            }
        }
        if (currentModeId === undefined) {
            let ele = document.querySelector("#default-mode");
            ele === null || ele === void 0 ? void 0 : ele.classList.add("current");
            let ele1 = ele.querySelector('.switch-mode-on');
            ele1.disabled = true;
        }
        let syncPanelLogic = new SyncPanelLogic(dataManager);
    });
}
Main();
//# sourceMappingURL=popup.js.map