// Main class of the whole drawing stuff
// Contains all the elements on the scenery
// Manages addition/removal of elements and rulers
// Builds the Canvas and manages drawing

function FloorPlan(container){
	this.container = container;
		
	this.scale = 8;
	this.width = 120;
	this.height = 80;	

	this.receivers = [];	
	this.roads = [];
	this.obstacles = [];
	this.wallCnt = 0;
	this.houseCnt = 0;
	
	this.activeReceiverIdx = 0;
	
	this.init();
}

FloorPlan.prototype.init = function(){
	
	var that = this;
	
	this.onFocusElementCallback = new MultiCallback();
	this.onMoveStopCallback = new MultiCallback();
	
	this.stage = new Kinetic.Stage(
		{
			container: this.container,
			width: this.width * this.scale,
			height: this.height * this.scale
		}
	);

	
	this.background = new Kinetic.Layer();
	this.background.setScale(this.scale, this.scale);
	
	this.bgrect = new Kinetic.Rect(
		{
			x: 0,
			y: 0,
			width: this.width,
			height: this.height,
			fill: "#DDDDDD",
			strokeWidth: 0
		}
	);

	this.overlay = new Kinetic.Layer();
	this.overlay.setScale(this.scale, this.scale);
	
	
	this.background.add(this.bgrect);

	this.planLayer = new Kinetic.Layer();
	this.planLayer.setScale(this.scale, this.scale);

	this.rcvLayer = new Kinetic.Layer();
	this.rcvLayer.setScale(this.scale, this.scale);

	this.rulerLayer = new Kinetic.Layer();

	this.heatmapLayer = new Kinetic.Layer();

	this.stage.add(this.background);
	this.stage.add(this.planLayer);		
	this.stage.add(this.rcvLayer);
	this.stage.add(this.rulerLayer);	

	this.stage.add(this.heatmapLayer);
	this.stage.add(this.overlay);

	this.buildMenu();

	this.background.on("click", 
		function(e){
			that.focusElement(that);	
		}
	);

	var animBg = new Kinetic.Animation(
		function(frame) {
			
  		},
		this.background
	);
		
	var animPlan = new Kinetic.Animation(
		function(frame) {
			
  		},
		this.planLayer
	);

	var animRcv = new Kinetic.Animation(
		function(frame) {
			
  		},
		this.rcvLayer
	);

	var animRuler = new Kinetic.Animation(
		function(frame) {
			
  		},
		this.rulerLayer
	);
	
	var animOverlay = new Kinetic.Animation(
		function(frame) {
			
  		},
		this.overlay
	);	

  	animBg.start();
  	animPlan.start();	
  	animRcv.start();	
  	animRuler.start();			
  	animOverlay.start();

}

FloorPlan.prototype.addRoad = function(data){
	var road = new FloorPlanRoad(
		this.planLayer,
		{
			top: 30, 
			left: 0, 
			bottom: 35, 
			right: 120, 
			vHeight: 0,
			draggableV: true,
			draggableH: false,
			resizeableTop: true,
			resizeableLeft: false,
			resizeableBottom: true,
			resizeableRight: false,
			roadLineWidth: 0.2,
			roadLinePadding: 0,
			floorplan: this,
			noiseLevel: 90
		},
		data
	);

	new Ruler(
		this.rulerLayer, 
		this.scale,
		road, Ruler.TOP, true,
		road, Ruler.BOTTOM, true,
		road, Ruler.CENTERH, 0
	);
	
	this.roads.push(road);
	this.addRulersRoadReceiverWall(road, this.receivers, this.obstacles);		
	this.triggerMoveStop();			
}

FloorPlan.prototype.addReceiver = function(data){
	
	var cnt = this.receivers.length;
	
	var receiver = new FloorPlanReceiver(	
		this.rcvLayer,
		{
			name: lang_add_reception_name + " " + (cnt + 1),
			top: 50,
			left: 60 + cnt * 5,
			pointRadius: 0.5,
			circleRadius: 6,
			minLevel: 25,
			maxLevel: 85,
			levelTics: 15, 
			vHeight: 1.5,
			draggableV: true,
			draggableH: true,
			resizeableTop: false,
			resizeableLeft: false,
			resizeableBottom: false,
			resizeableRight: false,
			floorplan: this
		},
		data
	);

	new Ruler(
		this.rulerLayer, 
		this.scale,
		this.roads[0], Ruler.AUTOV, false,
		receiver, Ruler.CENTERV, true,
		receiver, Ruler.LEFT, -2.5
	);
	
	new Ruler(
		this.rulerLayer, 
		this.scale,
		this.roads[0], Ruler.CENTERV, false,
		receiver, Ruler.CENTERV, true,
		receiver, Ruler.LEFT, 2.5
	);
	
	this.receivers.push(receiver);		
	this.addRulersRoadReceiverWall(this.roads, receiver, this.obstacles);
	this.triggerMoveStop();	
}

FloorPlan.prototype.addWall = function(data){
	
	this.wallCnt ++;
	var cnt = this.wallCnt;
	
	var wall = new FloorPlanDynamicRect(
		this.planLayer,
		{
			typeStr: lang_add_wall_type,
			name: lang_add_wall_name + " " + this.wallCnt,
			top: 42 + (cnt % 8) * 2, 
			left: 10 + (cnt % 8) * 2, 
			bottom: 42.5 + (cnt % 8) * 2, 
			right: 45 + (cnt % 8) * 2, 
			vHeight: 2,
			draggableV: true,
			draggableH: true,
			resizeableTop: false,
			resizeableLeft: true,
			resizeableBottom: false,
			resizeableRight: true,
			color: "#00AA00",
			opacity: 0.9,
			floorplan: this
		},
		data
	);
	
	this.obstacles.push(wall);	
	this.addRulersRoadReceiverWall(this.roads, this.receivers, wall);
	this.triggerMoveStop();		
}

FloorPlan.prototype.addRect = function(data){
	
	this.houseCnt ++;
	var cnt = this.houseCnt;
	
	var rect = new FloorPlanDynamicRect(
		this.planLayer,
		{
			typeStr: lang_add_building_type,
			name: lang_add_building_name + " " + this.houseCnt,
			top: 5 + cnt / 4, 
			left: 5 + (cnt % 4) * 15 + cnt / 4, 
			bottom: 15 + cnt / 4, 
			right: 15 + (cnt % 4) * 15 + cnt / 4, 
			vHeight: 10,
			draggableV: true,
			draggableH: true,
			resizeableTop: true,
			resizeableLeft: true,
			resizeableBottom: true,
			resizeableRight: true,
			color: "#0000AA",
			opacity: 0.9,
			floorplan: this
		},
		data
	);

	new Ruler(
		this.rulerLayer, 
		this.scale,
		rect, Ruler.RIGHT, true,
		rect, Ruler.LEFT, false,
		rect, Ruler.TOP, -2.5
	);

	new Ruler(
		this.rulerLayer, 
		this.scale,
		rect, Ruler.TOP, true,
		rect, Ruler.BOTTOM, false,
		rect, Ruler.RIGHT, 2.5
	);
	
	this.obstacles.push(rect);
	this.addRulersRoadReceiverHouse(this.roads, this.receivers, rect);
	this.triggerMoveStop();	
}

FloorPlan.prototype.addRulersRoadReceiverHouse = function(road, rcv, house){
	
	var roadArr = (new Array()).concat(road);
	var rcvArr = (new Array()).concat(rcv);
	var houseArr = (new Array()).concat(house);		
	
	for(var i = 0; i < roadArr.length; i ++){
		var road = roadArr[i];
		for(var j = 0; j < rcvArr.length; j ++){	
			var rcv = rcvArr[j];		
			for(var k = 0; k < houseArr.length; k ++){
				var house = houseArr[k];				

				new Ruler(
					this.rulerLayer, 
					this.scale,
					house, Ruler.RIGHT, true,
					rcv, Ruler.CENTERH, false,
					rcv, Ruler.CENTERV, -10.5
				);

				new Ruler(
					this.rulerLayer, 
					this.scale,
					house, Ruler.LEFT, true,
					rcv, Ruler.CENTERH, false,
					rcv, Ruler.CENTERV, -8
				);

				new Ruler(
					this.rulerLayer, 
					this.scale,
					road, Ruler.AUTOV, true,
					house, Ruler.AUTOV, true,
					house, Ruler.CENTERH, -2.5
				);
				
			}
		}
	}		
}

FloorPlan.prototype.addRulersRoadReceiverWall = function(road, rcv, wall){
	
	var roadArr = (new Array()).concat(road);
	var rcvArr = (new Array()).concat(rcv);
	var wallArr = (new Array()).concat(wall);		
	
	for(var i = 0; i < roadArr.length; i ++){
		var road = roadArr[i];
		for(var j = 0; j < rcvArr.length; j ++){	
			var rcv = rcvArr[j];		
			for(var k = 0; k < wallArr.length; k ++){
				var wall = wallArr[k];				
				this.addWallRulers(wall, rcv, road);			
				
			}
		}
	}		
}

FloorPlan.prototype.addWallRulers = function(wall, rcv, road){
	
	if(!rcv)
		rcv = this.receivers[0];
	if(!road)
		road = this.roads[0];
		
	if(wall.resizeableLeft){
		// horizontal
			new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.CENTERV, true,
			rcv, Ruler.CENTERV, false,
			wall, Ruler.RIGHT, +2
		);
							
		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.LEFT, true,
			wall, Ruler.RIGHT, true,
			wall, Ruler.CENTERV, -3
		);	
							
		new Ruler(
			this.rulerLayer, 
			this.scale,
			road, Ruler.CENTERV, false,
			wall, Ruler.CENTERV, true,
			wall, Ruler.RIGHT, +4.5
		);

		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.AUTOV, true,
			road, Ruler.AUTOV, true,
			wall, Ruler.LEFT, -2
		);
				
		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.LEFT, true,
			rcv, Ruler.CENTERH, false,
			wall, Ruler.CENTERV, 3
		);
				
		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.RIGHT, true,
			rcv, Ruler.CENTERH, false,
			wall, Ruler.CENTERV, 5.5
		);
	}
	else{
		// vertical
		new Ruler(
			this.rulerLayer, 
			this.scale,
			road, Ruler.AUTOV, false,
			wall, Ruler.AUTOV, true,
			wall, Ruler.LEFT, -3
		);
							
		new Ruler(
			this.rulerLayer, 
			this.scale,
			rcv, Ruler.AUTOH, false,
			wall, Ruler.AUTOH, true,
			wall, Ruler.CENTERV, -3
		);	
							
		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.TOP, true,
			rcv, Ruler.CENTERV, false,
			wall, Ruler.RIGHT, +2
		);

		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.BOTTOM, true,
			rcv, Ruler.CENTERV, false,
			wall, Ruler.RIGHT, +4.5
		);
				
		new Ruler(
			this.rulerLayer, 
			this.scale,
			wall, Ruler.TOP, true,
			wall, Ruler.BOTTOM, true,
			wall, Ruler.LEFT, -3
		);
				
	}
}


FloorPlan.prototype.del = function(obj){

	this.focusElement(this);

	for(var i = 0; i < this.obstacles.length; i ++)
		if(this.obstacles[i] == obj){
			this.obstacles.splice(i, 1);
			i --;
		}
		
	this.triggerMoveStop();
}

FloorPlan.prototype.getPersistentData = function(data){
	var save = new Object();
	
	var arrays = ["receivers", "roads", "obstacles"];
	
	for(var i = 0; i < arrays.length; i ++){
		var a = new Array();
		
		for(var j = 0; j < this[arrays[i]].length; j ++)
			a.push(this[arrays[i]][j].getPersistentData());	
		
		save[arrays[i]] = a;	
	}
	
	return save;
}

FloorPlan.prototype.loadFromPersistent = function(data){

	if(data && (data.roads.length > 0) && (data.receivers.length > 0)){
	
		var save = new Object();
	
		for(var i = 0; i < data.roads.length; i ++)
			this.addRoad(data.roads[i]);
			
		for(var i = 0; i < data.receivers.length; i ++)
			this.addReceiver(data.receivers[i]);
				
		for(var i = 0; i < data.obstacles.length; i ++){
			var obs = data.obstacles[i];
			if(obs.typeStr == lang_add_wall_type)
				this.addWall(obs);
			else if(obs.typeStr == lang_add_wall_type)
				this.addRect(obs);
		}
	}
	else{
		this.addRoad();
		this.addReceiver();
		/*
		this.addWall();
		this.addRect();	
		*/	
	}

}

FloorPlan.prototype.cursor = function(cursor){
	$("#" + this.container).css("cursor", cursor);
}

FloorPlan.prototype.onFocusElement = function(callback){
	this.onFocusElementCallback.add(callback);
}

FloorPlan.prototype.onMoveStop = function(callback){
	this.onMoveStopCallback.add(callback);
}

FloorPlan.prototype.focusElement = function(element){
	
	if(this.focussed != element){	
	
		if(this.focussed)
			this.focussed.blur();
			
		this.focussed = element;
		this.onFocusElementCallback.call(element);
	}
}

FloorPlan.prototype.blur = function(element){	

}

FloorPlan.prototype.triggerMoveStop = function(){
	this.onMoveStopCallback.call();
}

FloorPlan.prototype.buildMenu = function(){
	var that = this;
		
	this.menu = new ContextMenuDescriptor();
		
	this.menu.addText("typ", lang_add_type, lang_add_canvas, {}, "floorplan-info-typ");
	this.menu.addButton("newWall", lang_add_newwall, lang_add_newwall, function(){that.addWall();}, {}, "floorplan-info-neu");
	this.menu.addButton("newHouse", lang_add_newhouse, lang_add_newhouse, function(){that.addRect();}, {}, "floorplan-info-neu");
}
		
FloorPlan.prototype.getMenu = function(){
	return this.menu;
}

FloorPlan.prototype.getHelp = function(){
	return "floorplan-help-floorplan";
}

FloorPlan.prototype.getActiveReceiver = function(){
	return this.receivers[this.activeReceiverIdx];
}



