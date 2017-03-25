cc.Class({
    extends: cc.Component,

    properties: {
      _manager: null,
      _firstTimePlayer: true,
      _firstTimeBoom: true,
      g: -50,
      _speed : null,
      _stopMove: false,
    },

    init: function (originSpeed) {
        this._speed = originSpeed;
        this._manager = cc.director.getCollisionManager();
        this._manager.enabled = true;
        this._manager.enabledDebugDraw = true;
        this._manager.enabledDrawBoundingBox = true;
    },

    onCollisionEnter: function(other,self){
        if(other.node.group == 'player'){
            if(!this._firstTimePlayer){
                this._firstTimePlayer = false;
                this._stopMove = true;
                this.node.getChildByName("boom-range").active = true;
                // this.scheduleOnce(function(){
                //     if(this.node.parent){
                //         this.node.removeFromParent(true);
                //     }
                // }.bind(this),0);
            }
        }
        else if(other.node.group == 'ground'){
            //  if(!this._firstTimeBoom){
            //     this._firstTimeBoom = false;
                this._stopMove = true;
                    this.node.getChildByName("boom-range").active = true;
                    // this.scheduleOnce(function(){
                    //     if(this.node.parent){
                    //         this.node.removeFromParent(true);
                    //     }
                    // }.bind(this),0);
            //  }
        }
    },

    update: function(dt){
        if(!this._stopMove){
            this._speed.y += this.g * dt;
            this.node.position = cc.pAdd(this.node.position,cc.pMult(this._speed,dt));
        }
    }
});
