var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
faviconURL = (u) => "https://www.google.com/s2/favicons?domain=" + u + "&sz=16";
let dataManager = new DataManager();
let websiteListBinding = new WebsiteListBinding(document.querySelector("#edit-ingore-websites>ul"));
let settingInfo;
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        WebsiteListBinding.template = document.querySelector("#ignore-website-template");
        settingInfo = yield dataManager.getSettingInfo();
        let ignoreWebsites = settingInfo.ignoreWebsites;
        ignoreWebsites.forEach(w => {
            websiteListBinding.add(new Website(w, w));
        });
        websiteListBinding.onListChanged = (sender, action, index, value) => {
            let l = websiteListBinding.cloneWebsiteList();
            settingInfo.ignoreWebsites = l.map(x => x.url);
            dataManager.saveSettingInfo(settingInfo);
        };
        document.querySelector("#import-backup").addEventListener("click", ImportBackup);
        document.querySelector("#export-backup").addEventListener("click", ExportBackup);
        let input = document.querySelector("#input-ingore-websites>input");
        let regexForIgnoreWebsite = /^([a-zA-Z0-9]+\.)+[a-zA-Z]{2,3}/;
        document.querySelector("#add-ingore-website").addEventListener("click", () => {
            let url = input.value;
            if (regexForIgnoreWebsite.test(url)) {
                websiteListBinding.add(new Website(url, url));
                input.value = "";
            }
            else {
                alert(url + " is incorrect format.\nTrue format: <sub domain>.<domain name>.<top level domain>\n"
                    + "Eg: www.google.com.vn, www.google.com, google.com");
            }
        });
    });
}
function ExportBackup() {
    return __awaiter(this, void 0, void 0, function* () {
        let modes = yield dataManager.getAllModes();
        let dataSync = {
            settingInfo: settingInfo,
            modes: modes,
        };
        var downloadBtn = document.createElement("a");
        downloadBtn.href = 'data:application/json; charset=utf8, ' + encodeURIComponent(JSON.stringify(dataSync));
        let x = new Date();
        downloadBtn.download = "backup " + x.getFullYear() + "_" + (x.getMonth() + 1) + "_" + x.getDate() + " " + (x.getTime() % 86400000) + " of MultiMode For Chrome";
        downloadBtn.setAttribute("style", "display:none;");
        downloadBtn.click();
    });
}
function ImportBackup() {
    return __awaiter(this, void 0, void 0, function* () {
        var upload = document.createElement("input");
        upload.type = "file";
        upload.accept = "application/json";
        upload.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
            let file = upload.files[0];
            let dataSync = JSON.parse(yield file.text());
            upload.remove();
            try {
                if (dataSync.settingInfo === undefined)
                    throw new Error("dataSync.settingInfo === undefined");
                if (dataSync.settingInfo.ignoreWebsites === undefined)
                    throw new Error("dataSync.settingInfo.ignoreWebsites === undefined");
                if (dataSync.modes === undefined)
                    throw new Error("dataSync.modes === undefined");
                dataSync.modes.forEach(mode => {
                    if (mode.title === undefined)
                        throw new Error("mode.title === undefined");
                    if ((typeof mode.title) !== "string") {
                        console.log(mode.title);
                        throw new Error("mode.title is not string");
                    }
                    if (mode.items === undefined)
                        throw new Error("mode.items === undefined");
                    if (mode.id === undefined)
                        throw new Error("mode.id === undefined");
                });
            }
            catch (error) {
                console.error(error);
                console.log(dataSync);
                alert("The file you imported is not backup file of Multi Modes for browser.");
                return;
            }
            yield dataManager.getAllModeIds();
            dataManager.importManyMode(dataSync.modes);
            let f = websiteListBinding.onListChanged;
            websiteListBinding.onListChanged = () => { };
            dataSync.settingInfo.ignoreWebsites.forEach(w => {
                if (!settingInfo.ignoreWebsites.includes(w)) {
                    websiteListBinding.add(new Website(w, w));
                }
            });
            let l = websiteListBinding.cloneWebsiteList();
            settingInfo.ignoreWebsites = l.map(x => x.url);
            dataManager.saveSettingInfo(settingInfo);
            websiteListBinding.onListChanged = f;
        }));
        upload.click();
    });
}
Main();
//# sourceMappingURL=settingPage.js.map