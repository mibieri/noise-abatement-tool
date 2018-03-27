// An object on the FloorPlan
// Parent class for all objects
// Defines (and implements) some methods which must be provided by any object on the scenery
// Methods for getting/setting position, geometry computation and saving


var FloorPlanObject = Class.extend({
	
	init: function(layer, config, data){
		this.layer = layer;

		this.top = 0;
		this.bottom = 0;
		this.left = 0;
		this.right = 0;	
		
		this.width = 0;
		this.height = 0;
		
		this.vHeight = 0;
		
		this.angle = 0;
		
		this.ruler = [];

		for(var k in config){
			this[k] = config[k];	
		}

		for(var k in data){
			this[k] = data[k];	
		}
		
		this.onPlanChangeCallback = new MultiCallback();
		this.onMoveStartCallback = new MultiCallback();
		this.onMoveStopCallback = new MultiCallback();

		this.group = new Kinetic.Group();
		this.setTop(this.top);
		this.setLeft(this.left);
		this.setBottom(this.bottom);
		this.setRight(this.right);
	},
	
	// check whether objects overlap
	// only works for convex objects!
	convexIsOverlappingWith: function(obj){
		var objVecs = obj.getDefiningVectors();
		
		var int;
		
		
		//console.log("***** Checking for obj having points inside us:");
		
		
		for(var i = 0; i < objVecs.length; i ++){
			var v = objVecs[i];
			//console.log("t = " + v.top + ", l = " + v.left + ", len = " + v.len + ", angle = " + v.angle);
			
			// check for obj having points inside us
			if(this.convexIsPointInside(objVecs[i]))
				return true;	
				
			// check for crossing defining vecs
			int = NoiseCalculator.intersect(v, this);
			if(int.length > 0)
				return true;
		}

		//console.log("***** Checking for us having points inside obj:");

		var myVecs = this.getDefiningVectors();

		// check for us having points inside obj
		for(var i = 0; i < myVecs.length; i ++){
			var v = myVecs[i];
			//console.log("t = " + v.top + ", l = " + v.left + ", len = " + v.len + ", angle = " + v.angle);
			if(obj.convexIsPointInside(myVecs[i]))
				return true;	
		}
		
		//console.log("***** Finished checking. No overlap found.");
		
		return false;
	},
	
	
	// check whether a point is inside the outline of an object
	// only works for convex objects!
	convexIsPointInside: function(point){
		var p = new Object();
		
		p.top = point.top;
		p.left = point.left;
		p.len = 1;
		p.infinitePos = true;
		p.infiniteNeg = false;
		p.obj = null;
							
		// all this intersection stuff should be reorganised
		
		var int = null
		
		p.angle = 0;
		int = NoiseCalculator.intersect(p, this);		
		if(int.length == 0)
			return false;

		p.angle = 2 * Math.PI / 3;
		int = NoiseCalculator.intersect(p, this);		
		if(int.length == 0)
			return false;
	
		p.angle = - 2 * Math.PI / 3;
		int = NoiseCalculator.intersect(p, this);		
		if(int.length == 0)
			return false;
					
		return true;
		
	},

	getDefiningVectors: function(){
		return new Array(
			{top: this.top, left: this.left, len: this.width, angle: this.angle, infinitePos: false, infiniteNeg: false, obj: this},
			{top: this.bottom, left: this.left, len: this.width, angle: this.angle, infinitePos: false, infiniteNeg: false, obj: this},
			{top: this.top, left: this.left, len: this.height, angle: this.angle + Math.PI / 2, infinitePos: false, infiniteNeg: false, obj: this},
			{top: this.top, left: this.right, len: this.height, angle: this.angle + Math.PI / 2, infinitePos: false, infiniteNeg: false, obj: this}							
		);
	},
	
	moveTopTo: function(m){
		var h = this.height;
		this.top = m;
		this.bottom = m + h;
		this.group.setY(this.top);		
	},
	
	moveLeftTo: function(m){
		var w = this.width;
		this.left = m;
		this.right = m + w;
		this.group.setX(this.left);		
	},
	
	setTop: function(m){
		this.top = m;
		this.group.setY(this.top);
		
		this.height = this.bottom - this.top;
		
	},
	
	setLeft: function(m){
		this.left = m;
		this.group.setX(this.left);
		
		this.width = this.right - this.left;
	},
	
	setBottom: function(m){
		this.bottom = m;
		
		this.height = this.bottom - this.top;
	},
	
	setRight: function(m){
		this.right = m;
		
		this.width = this.right - this.left;
	},	
		
	getTop: function(){
		return this.top;
	},
	
	getLeft: function(){
		return this.left;
	},
	
	getBottom: function(){
		return this.bottom;
	},
	
	getRight: function(){
		return this.right;
	},
	
	getCenterV: function(){
		return (this.bottom + this.top) / 2;
	},
	
	getCenterH: function(){
		return (this.left + this.right) / 2;
	},
	
	getHelp: function(){
		return this.help;	
	},
	
	getMenu: function(){
		var that = this;
		
		var menu = new ContextMenuDescriptor(function(){return that.getMenu();});
		
		menu.addText("typ", "Typ", this.typeStr, {}, "floorplan-info-typ");
		menu.addInput("name", "Name", this.name, function(val){that.setName(val);}, {}, "floorplan-info-name");		
		
		return menu;
	},

	setHeight: function(h){
		this.vHeight = parseFloat(h);
		this.triggerPlanChange();
		this.triggerMoveStop();
	},
	
	getHeight: function(){
		return Math.abs(this.top - this.bottom);	
	},
	
	setType: function(type){
		this.typeStr = typeStr;	
	},
	
	setName: function(name){
		this.name = name;
		this.triggerMoveStop();
	},
	
	
	refresh: function(){
	
	},
	
	del: function(){
		this.removeRulers();
			
		this.group.destroy();
		this.floorplan.del(this);	
	},
	
	addRuler: function(ruler){
		this.ruler.push(ruler);
	},

	removeRulers: function(){
		// rulers will detach themselves, so array shrinks more and more
		while(this.ruler.length)
			this.ruler[0].del();
	},
	
	removeRuler: function(ruler){
		for(var i = 0; i < this.ruler.length; i ++)
			if(this.ruler[i] == ruler)
				this.ruler.splice(i, 1);
	},

	triggerPlanChange: function(){
		for(var i = 0; i < this.ruler.length; i ++)
			this.ruler[i].planChanged();
		
		this.onPlanChangeCallback.call();
	},

	triggerMoveStart: function(){
		this.onMoveStartCallback.call();
	},
	
	triggerMoveStop: function(){
		this.floorplan.triggerMoveStop();
		this.onMoveStopCallback.call();
	},	
		
	focus: function(){
		if(!this.highlighted){
			this.highlighted = true;
			if(this.floorplan)
				this.floorplan.focusElement(this);
	
			for(var i = 0; i < this.ruler.length; i ++)
				this.ruler[i].moveStarted();			
							
			this.refresh();
		}
	},
	
	blur: function(){
		this.highlighted = false;
		if(this.floorplan)
			this.floorplan.blur(this);

		for(var i = 0; i < this.ruler.length; i ++)
			this.ruler[i].moveStopped();
			
		this.refresh();
	},

	onPlanChange: function(callback){
		this.onPlanChangeCallback.add(callback);	
	},

	onMoveStart: function(callback){
		this.onMoveStartCallback.add(callback);	
	},
	
	onMoveStop: function(callback){
		this.onMoveStopCallback.add(callback);	
	},
	
	getPersistentData: function(){
		return ret = {
			top: this.top,
			bottom: this.bottom,
			left: this.left,
			right: this.right,			
			angle: this.angle,
			vHeight: this.vHeight,
			name: this.name
		};
	}

});