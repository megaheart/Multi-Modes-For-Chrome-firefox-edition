/// <reference path="Website.ts" />
// Logic of .group-editor-main > .websites-area > ul

function faviconURLByChromeAPI(u:string) {
    // const url = new URL(browser.runtime.getURL("/_favicon/"));
    // url.searchParams.set("pageUrl", u);
    // url.searchParams.set("size", "32");
    // return url.toString();

    const url = new URL(browser.runtime.getURL("/icons/website-icon.png"));
    // url.searchParams.set("pageUrl", u);
    // url.searchParams.set("size", "32");
    return url.toString();
}

let faviconURL = faviconURLByChromeAPI;

class WebsiteListBinding{
    private items:Website[];
    private uList:HTMLUListElement;
    private _disableButtons:boolean;
    static template:HTMLTemplateElement|null;
    constructor(uList:HTMLUListElement|null) {
        this.items = [];
        if(uList){
            this.uList = uList;
        }
        this._disableButtons = false;
    }
    set disableButtons(value:boolean){
        if(this._disableButtons!=value){
            if(value){
                this.uList.querySelectorAll<HTMLButtonElement>("button.remove-website-from-mode").forEach(e=>{
                    e.disabled = true;
                });
            }
            else{
                this.uList.querySelectorAll<HTMLButtonElement>("button.remove-website-from-mode").forEach(e=>{
                    e.disabled = false;
                });
            }
            this._disableButtons = value;
        }
    }
    getElementAt(i:number):Website{
        return this.items[i];
    }
    get length():number{
        return this.items.length;
    }
    cloneWebsiteList(){
        return [...this.items];
    }
    onListChanged:(sender:WebsiteListBinding, action:"insert" | "remove", index:number, value:Website)=>void;
    forEach(enumirator:(e:Website)=>void):void{
        this.items.forEach(enumirator);
    }
    private generateElement(value:Website):HTMLLIElement{
        let li = WebsiteListBinding.template!.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
        li.querySelector<HTMLImageElement>("img.favicon")!.src = faviconURL(value.url);
        li.querySelector<HTMLSpanElement>("span.website-title")!.textContent = value.title;
        li.querySelector<HTMLDivElement>("div.website-header")!.addEventListener("click", ()=>{
            browser.tabs.create({url:value.url});
        });
        let btn = li.querySelector<HTMLButtonElement>("button.remove-website-from-mode");
        btn!.disabled = this._disableButtons;
        btn!.addEventListener("click", ()=>{
            let index = this.items.indexOf(value);
            this.removeAt(index);
            if(this.onListChanged) this.onListChanged(this, "remove", index, value);
        });
        return li;
    }
    insert(index:number, value:Website):void{
        if(index > this.items.length || index < 0) 
            throw new RangeError("Index (" + index +") is out of range [0.." + this.length + "]");
        else if(index == this.items.length){
            this.uList.appendChild(this.generateElement(value));
        }
        else{
            this.uList.insertBefore(this.generateElement(value), this.uList.children[index]);
        }
        this.items.splice(index, 0 , value);
        if(this.onListChanged) this.onListChanged(this, "insert", index, value);
    }
    add(value:Website):void{
        this.uList.appendChild(this.generateElement(value));
        this.items.push(value);
        if(this.onListChanged) this.onListChanged(this, "insert", this.items.length - 1, value);
    }
    removeAt(index:number){
        this.uList.children[index].remove();
        this.items.splice(index, 1);
        //Event notifies at this.generateElement
    }
    //Return old Websites' array
    clearAllItem():Website[]{
        this.uList.textContent = '';
        return this.items.splice(0, this.items.length);
    }
}