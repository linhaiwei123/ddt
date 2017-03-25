cc.Class({
    extends: cc.Component,

    editor: {
        requireComponent: require('test-graphic-helper'),
    },

    properties: {
        //otherCollider: cc.PolygonCollider,
        _manager: null,
        _greinerHormann: null,

        _downBlock: false,
        _leftBlock: false,
        _rightBlock: false,
        _upBlock: false,

        _left: false,
        _right: false,

        _staticTouchColliderArray: [],
        _moveDir: null,
    },

    //[fix]  push the player to the surface


    onLoad: function () {
        this._manager = cc.director.getCollisionManager();
        this._manager.enabled = true;
        this._manager.enabledDebugDraw = true;
        this._manager.enabledDrawBoundingBox = true;
        
        this._greinerHormann = require('greiner-hormann');

        cc.systemEvent.on("keydown",this.onKeyDown,this)
        cc.systemEvent.on("keyup",this.onKeyUp,this)
    
        //this.updateCollider(this.otherCollider)
    },

    onKeyDown: function(e){
        switch(e.keyCode){
            case cc.KEY.left: {this._left = true;break;}
            case cc.KEY.right: {this._right = true;break;}
        }
    },

    onKeyUp: function(e){
        switch(e.keyCode){
            case cc.KEY.left: {this._left = false;break;}
            case cc.KEY.right: {this._right = false;break;}
        }
    },

    onCollisionEnter: function(other,self){
        //console.log('collidionEnter');
        if(other.node.group == 'ground'){
            this._staticTouchColliderArray[other.uuid] = other;
        }
    },

    onCollisionExit: function(other,self){
        //console.log('collidionExit');
       if(other.node.group == 'ground'){ 
         delete this._staticTouchColliderArray[other.uuid];
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

    //input other collider
    //output my intersect local
    getIntersection: function(otherCollider){
        let otherWorldPoint = this.getWorldPoints(otherCollider);
        let selfCollider = this.node.getComponent(cc.PolygonCollider);
        let selfWorldPoint = this.getWorldPoints(selfCollider);
        let selfOldOffset = selfCollider.offset;
        let intersectArray = this._greinerHormann.intersection(selfWorldPoint, otherWorldPoint);
        if(!intersectArray){
            return null;
        }
            let item = intersectArray[0];
            let itemWithoutLast = item.splice(0,item.length - 1);
            let nodePoints = this.getNodePoints(itemWithoutLast,selfCollider);
            return nodePoints;

    },


    getPointSide: function(point){
        if(point.x > 0 && point.y > 0){
            return 'right-up';
        }
        else if(point.x > 0 && point.y < 0){
            return 'right-down';
        }
        else if(point.x < 0 && point.y > 0){
            return 'left-up';
        }
        else if(point.x < 0 && point.y < 0){
            return 'left-down';
        }
    },

    getPointsEdge: function(surfacePoint,originPoint){
        let edges = this.getPointSide(originPoint).split('-');
        if(originPoint.x == surfacePoint.x){
            return edges[0];
        }else if(originPoint.y == surfacePoint.y){
            return edges[1];
        }
    },

    //key!!  
    //input my intersect local
    //output ?test
    //goal: moveable? move direction? 
    analysisBlock: function(){
        let otherNodePointsArray = [];
        let keys = Object.keys(this._staticTouchColliderArray);
        for(let colliderUuid of keys){
            let collider = this._staticTouchColliderArray[colliderUuid];
            if(collider.isValid){
                let otherNodePoints = this.getIntersection(collider);
            
                if(otherNodePoints){
                    otherNodePointsArray.push(otherNodePoints);
                }
            }
            
        }

        let result = [];
        let selfNodePoints = this.getComponent(cc.PolygonCollider).points;
        for(let otherNodePoints of otherNodePointsArray){
            let sideNodePoints = [];
            let surfaceNodePoints = [];
            for(let otherNodePoint of otherNodePoints){
                let isSideNodePoint = false;
                let isEdgeSurfaceNodePoint = false;
                for(let selfNodePoint of selfNodePoints){
                    if(selfNodePoint.x == Math.round(otherNodePoint.x) && selfNodePoint.y == Math.round(otherNodePoint.y)){
                        //is the side point
                        isSideNodePoint = true;
                        sideNodePoints.push({
                            point: selfNodePoint,
                            side: this.getPointSide(selfNodePoint),
                        });
                    }else if(selfNodePoint.x == Math.round(otherNodePoint.x) || selfNodePoint.y == Math.round(otherNodePoint.y)){
                        isEdgeSurfaceNodePoint = this.getPointsEdge(otherNodePoint,selfNodePoint);
                    }
                }
                if(!isSideNodePoint){
                    surfaceNodePoints.push({
                        edge: isEdgeSurfaceNodePoint,
                        point: otherNodePoint,
                    });
                    isEdgeSurfaceNodePoint = false;
                }else{
                    isSideNodePoint = false;
                }

            }
            result.push({
                sideNodePoints,
                surfaceNodePoints
            });
        }
        //analysys pass
        //console.log(result);
        
        //parse the analysis to block and move dir
        //too many situation...
        //solution: get the surface that touch the side of selfCollider
       
        let blockHasReset = false;

        for(let resultItem of result){
            let filterSurfaceNodePoints = [];
            for(let item of resultItem.surfaceNodePoints){
                if(item.edge){
                    filterSurfaceNodePoints.push(item);
                }
            }
            if(filterSurfaceNodePoints.length < 2){continue;}
            if(!blockHasReset){
                blockHasReset = true;
                    this._leftBlock = false;
                    this._rightBlock = false;
                    this._upBlock = false;
                    this._downBlock = false;
            }
            
                let subVector = cc.pSub(filterSurfaceNodePoints[0].point,filterSurfaceNodePoints[1].point);

                //the angle here is useless
                //we should get the inner point near the edge points
                //we should check every near point the set the block
                let shouldSetMoveDir =  this.checkBlock(resultItem);
                // if(shouldSetMoveDir){
                //     //push up the player to the surface
                //     this.fixPosition(resultItem,filterSurfaceNodePoints);
                // }
                //算了  就这样吧 沼泽模式  爬爬两下就沉下去了

                // let angle = cc.pToAngle(subVector) * 180 / Math.PI;
                // if(angle < 0){
                //     angle += 180;
                // }
                // console.log(angle);
                //let shouldSetMoveDir = true;
                //[fix] we should get the center point of the surface to check the angle 
                //get a random inner the box (maybe the point near the surface would be better)
                //[modify]

                
                if(this.hasSide('left-down',resultItem.sideNodePoints) && this.hasSide('right-down',resultItem.sideNodePoints)){
                    this._downBlock = true;
                }
                if(shouldSetMoveDir){
                    let rawMoveDir = cc.pNormalize(subVector);
                    if(rawMoveDir.x < 0){
                        rawMoveDir = cc.pNeg(rawMoveDir);
                    }
                    this._moveDir = rawMoveDir;
                    //console.log(this._moveDir);
                }

        }
        //enough  !!!
        //block set
        
        //move dir set
        if(Object.keys(this._staticTouchColliderArray).length == 0){
            this._downBlock = false;
        }
    },

    fixPosition: function(resultItem,filterPoints){
        let sideNodePoints = resultItem.sideNodePoints;
        let surfaceNodePoints = resultItem.surfaceNodePoints;
        let midSurfaceNodePoint = cc.pMult(cc.pAdd(filterPoints[0].point,filterPoints[1].point),0.25);
        if(midSurfaceNodePoint.mag() > this.node.height / 2){
            this.node.position = cc.pAdd(this.node.position,midSurfaceNodePoint);
        }
        //console.log(midSurfaceNodePoint);
    },

    checkBlock: function(resultItem){
        let sideNodePoints = resultItem.sideNodePoints;
        let surfaceNodePoints = resultItem.surfaceNodePoints;
        let shouldSetMoveDir = true;
        for(let i = 0; i < surfaceNodePoints.length - 1 ;i++){
            let firstPoint = surfaceNodePoints[i].point;
            let secondPoint = surfaceNodePoints[i + 1].point;
            let subVector = cc.pSub(firstPoint,secondPoint);
            let angle = cc.pToAngle(subVector) * 180 / Math.PI;
            if(angle < 0){
                angle += 180;
            }
            if(angle <= 90 && angle > 75 && this.hasSide('right-down',sideNodePoints)){
                this._rightBlock = true;
                shouldSetMoveDir = false;
            }
            if(angle >= 90 && angle < 105 && this.hasSide('left-down',sideNodePoints)){
                this._leftBlock = true;
                shouldSetMoveDir = false;
            }
            if(angle <= 90 && angle > 75 && this.hasSide('left-up',sideNodePoints)){
                this._leftBlock = true;
                shouldSetMoveDir = false;
            }
            if(angle >= 90 && angle < 105 && this.hasSide('right-up',sideNodePoints)){
                this._rightBlock = true;
                shouldSetMoveDir = false;
            }
        }
        return shouldSetMoveDir;
    },

    hasSide: function(side,points){
        for(let point of points){
            if(side == point.side){
                return true;
            }
        }
        return false;
    },

    getFirstInnerPoint: function(points){
        for(let point of points){
            if(points.edge == false){
                return point;
            }
        }
    },

    update: function(){
        if(this._downBlock){
            if(this._right && !this._rightBlock){
                this.node.position = cc.pAdd(this.node.position,this._moveDir);
            }if(this._left && !this._leftBlock){
                this.node.position = cc.pAdd(this.node.position,cc.pNeg(this._moveDir));
            }
        }
        if(!this._downBlock){
            this.node.y -= 1;
        }
        this.analysisBlock();
    }

});
