cc.Class({
    extends: cc.Component,

    editor: {
        executeInEditMode: true,
        requireComponent: cc.Graphics,
        disallowMultiple: true,
    },

    properties: {
        _ctx: null,
        _polygonComponents: {
            get: function(){
                return this.getComponents(cc.PolygonCollider)
            }
        }
    },

    onLoad: function () {
        this._ctx = this.getComponent(cc.Graphics);
        if(!cc.EDITOR){
            this.customUpdate();
            this.node.on('refresh',this.customUpdate,this);
            return;
        }else{
            this.customUpdate();
        }
        

    },

    customUpdate: function(){
            this._ctx.clear();
            let polygonComponents = this._polygonComponents;
            if(!polygonComponents){return;}
            for(let polygonComponent of polygonComponents){
                let offset = polygonComponent.offset;
                let points = polygonComponent.points;
                this._ctx.moveTo(points[0].x + offset.x,points[0].y + offset.y);
                for(let i = 1; i < points.length; i++){
                    this._ctx.lineTo(points[i].x + offset.x,points[i].y + offset.y);
                }
                this._ctx.fill();
            }
        
    }




});
