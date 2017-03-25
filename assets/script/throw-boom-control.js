cc.Class({
    extends: cc.Component,

    properties: {
       boomPrefab: cc.Prefab,
       _polygonComp: {
           get: function(){
               return this.node.getComponent(cc.PolygonCollider)
           }
       },
       _points: null,
       _throwReady: false,
    },

    onLoad: function () {
        this._points = this._polygonComp.points;
        cc.find('Canvas').on('touchstart',this.onTouchStart,this);
        cc.find('Canvas').on('touchcancel',this.onRelease,this);
        cc.find('Canvas').on('touchend',this.onRelease,this);
    },

    onTouchStart: function(e){
        let isHit = this.check(e.getLocation());
        //console.log(isHit);
        if(isHit){
            this._throwReady = true;
        }
    },

    onRelease: function(e){
        if(!this._throwReady){return;}
        this._throwReady = false;
        let originPoint = this.node.parent.convertToWorldSpaceAR(this.node.position);
        let revertPoint = e.getLocation();
        let originSpeed = cc.pSub(originPoint,revertPoint);
        let boom = cc.instantiate(this.boomPrefab);
        boom.position = cc.pAdd(this.node.position,cc.v2(0,10));
        boom.parent = this.node.parent;
        boom.getComponent('test-boom-script').init(originSpeed);
    },

    check: function(location){
        let node = this.node;
        let pointInNode = node.convertToNodeSpaceAR(location);
        // if(pointInNode.x < -node.width/2 || pointInNode.x > node.width/2 || pointInNode.y > node.height/2 || pointInNode.y < -node.height/2){
        //     return false;
        // }
        
        let i, j, c = false;
        
        let nvert = this._points.length;
        let testx = pointInNode.x;
        let testy = pointInNode.y;
        let vert = this._points;
        
        for(i = 0, j = nvert - 1; i < nvert; j = i++){
            if ( ( (vert[i].y > testy) != (vert[j].y > testy) ) && 
                ( testx < ( vert[j].x - vert[i].x ) * ( testy - vert[i].y ) / ( vert[j].y - vert[i].y ) + vert[i].x ) ) 
                c = !c; 
        } 
        
        return c; 
    }
});
