class PropertyChangedEvent{
    private _propertyName:string;
    get propertyName():string{return this._propertyName;}
    constructor(propertyName:string) {
        this._propertyName = propertyName;
        
    }
}
interface NotifyPropertyChanged{
    addPropertyListener(listener:(sender:Object, e:PropertyChangedEvent)=>void):void;
}
class NotifyPropertyChangedExample implements NotifyPropertyChanged{
    private listeners: (sender: Object, e: PropertyChangedEvent) => void;
    addPropertyListener(listener: (sender: Object, e: PropertyChangedEvent) => void): void {
        let x = this.listeners;
        if(x === undefined){
            this.listeners = listener;
        }
        else{
            this.listeners = (sender: Object, e: PropertyChangedEvent)=>{
                x(sender, e);
                listener(sender,e);
            }
        }
    }
}