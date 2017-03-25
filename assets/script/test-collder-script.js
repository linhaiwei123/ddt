cc.Class({
    extends: cc.Component,

    editor: {
        requireComponent: require('test-graphic-helper'),
    },

    properties: {
        //otherCollider: cc.PolygonCollider,
        _manager: null,
        _greinerHormann: null,
    },

    onLoad: function () {
        //test pass!!!!
        //opt test for mask

        //console.log(this.node.parent.getComponent(cc.Mask));
        //退而求其次

        // let selfCollider = this.getComponent(cc.PolygonCollider);
        // let otherCollider = this.otherCollider;
        //let boxCollider = this.getComponent(cc.BoxCollider);
        //console.log(this.node.name);
        //console.log(otherCollider);
        //console.log(cc.director.getCollisionManager());
        this._manager = cc.director.getCollisionManager();
        this._manager.enabled = true;
        this._manager.enabledDebugDraw = true;
        this._manager.enabledDrawBoundingBox = true;
        
        this._greinerHormann = require('greiner-hormann');
        // let selfWorldPoint = this.getWorldPoints(selfCollider);
        // let otherWorldPoint = this.getWorldPoints(otherCollider);

        //  let diff = this._greinerHormann.diff(selfWorldPoint, otherWorldPoint);
        //  console.log(this.node.name);
        //  console.log(diff);
        //  selfCollider.points = this.getNodePoints(diff[0],selfCollider);
        //  manager.updateCollider(selfCollider);
        //  console.log(selfCollider);
        //this.updateCollider(this.otherCollider);
    },

    onCollisionEnter: function(other,self){
        if(other.node.group == 'boom'){
            this.updateCollider(other);
        }
    },

    getWorldPoints: function(collider){
        let worldOffset = cc.pAdd(collider.node.parent.convertToWorldSpaceAR(collider.node.position),collider.offset);
        let result = [];
        for(let item of collider.points){
            let worldPoint = cc.pAdd(item,worldOffset);
            result.push(worldPoint);
        }
        return result;
    },

    getNodePoints: function(worldPoints,collider){
       let result = [];
       for(let item of worldPoints){
           let nodePoint = collider.node.convertToNodeSpaceAR(item);
           let colliderPoint = cc.pSub(nodePoint,collider.offset);
           result.push(colliderPoint);
       }
       return result;
    },

    updateCollider: function(otherCollider){
        //cause it would divide into many collider 
        //the solution is to remove the old collder and add new collder
        let otherWorldPoint = this.getWorldPoints(otherCollider);
        let selfColliderArray = this.node.getComponents(cc.PolygonCollider);
        for(let selfCollider of selfColliderArray){
            //diff one by one
            let selfWorldPoint = this.getWorldPoints(selfCollider);
            let selfOldOffset = selfCollider.offset;
            let diffArray = this._greinerHormann.diff(selfWorldPoint, otherWorldPoint);
            if(diffArray){
                for(let item of diffArray){
                    //remove the last item cause it is the same as the first item
                    let itemWithoutLast = item.splice(0,item.length - 1);
                    //console.log(item);
                    //item.reverse();
                    //a bunch of new points
                    let nodePoints = this.getNodePoints(itemWithoutLast,selfCollider);
                    //this.node.parent.getComponent('test-mask-script')._polygonArray = itemWithoutLast;

                    let newPolygonCollider = this.node.addComponent(cc.PolygonCollider);
                    newPolygonCollider.points = nodePoints;
                    newPolygonCollider.offset = selfOldOffset;
                    newPolygonCollider.world.points = itemWithoutLast;
                    //console.log(newPolygonCollider);
                    
                    this._manager.addCollider(newPolygonCollider);
                }
                //when we destroy the collider , it would auto remove from mgr
                this.scheduleOnce(function(){
                    if(selfCollider.isValid){
                        selfCollider.destroy();
                    }
                    this.scheduleOnce(function(){
                        this.node.emit('refresh');
                    }.bind(this),0);
                    
                }.bind(this),0);
            }
          
                

        }
        otherCollider.node.parent.removeFromParent(true);

    },

});
