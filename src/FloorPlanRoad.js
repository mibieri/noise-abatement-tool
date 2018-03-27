// Represents the road
// Inherits from FloorPlanDynamicObject
// Graphical representation is a road
// Additionally, a noise level can be specified
// Dragging and resizing is restricted to vertical axis

var FloorPlanRoad = FloorPlanDynamicObject.extend({
	
	init: function(layer, config, data){
		var that = this;
		
		config.bgcolor = "#333333";
		config.bgopacity = 1;
										
		this._super(layer, config, data);		


		this.angle = 0;
		this.type = NoiseCalculator.TYPE_ROAD;
		this.help = "floorplan-help-road";

		this.rect = new Kinetic.Rect(
			{
				fill: "#444444",
				opacity: 1,
				strokeWidth: 0
			}
		);

		this.topBorder = new Kinetic.Line({
			points: [0, 0],
        	stroke: 'white',
        	strokeWidth: this.roadLineWidth
      	});
			
		this.bottomBorder = new Kinetic.Line({
			points: [0, 0],
        	stroke: 'white',
        	strokeWidth: this.roadLineWidth
      	});		

		this.middleGroup = new Kinetic.Group();
		
		this.contentGroup.add(this.rect);	
		this.contentGroup.add(this.topBorder);
		this.contentGroup.add(this.bottomBorder);
		this.contentGroup.add(this.middleGroup);
		
		this.buildMenu();

		this.dragAnchor.on("click", 
			function(e){
				that.focus();	
			}
		);
		
		this.refresh();		
	},
	
	
	
	refresh: function(){
		this._super();
		
		this.rect.setX(0);
		this.rect.setY(this.roadLinePadding);
		this.rect.setWidth(this.width);
		this.rect.setHeight(this.height);
		
		this.topBorder.setPoints(
			[
				[0, this.roadLinePadding],
				[this.width, this.roadLinePadding]
			]
		);

		this.bottomBorder.setPoints(
			[[0, this.height - this.roadLinePadding],
			[this.width, this.height - this.roadLinePadding]]
		);


		this.middleGroup.removeChildren();
		
		var dashPeriod = 6;
		var dashLen = 3;
		
		for(var i = 0; i < this.width / dashPeriod + 1; i ++){
			var middle = new Kinetic.Line({
				points: [
					[dashPeriod * i, this.height / 2],
					[dashPeriod * i + dashLen, this.height / 2]
				],
				stroke: 'white',
				strokeWidth: this.roadLineWidth,
				dashArray: [3, 3]
			});		
			this.middleGroup.add(middle);	
		} 		
	},

	getRoadVector: function(){
		return new Array(
			{top: (this.top + this.bottom) / 2, left: this.left, len: 1, angle: this.angle, infinitePos: true, infiniteNeg: true, obj: this}							
		);
	},
	
	buildMenu: function(){
		var that = this;
		
		this.menu = new ContextMenuDescriptor();
		
		this.menu.addText("typ", "Typ", "Strasse", {}, "floorplan-info-typ");
		this.menu.addInput("laermemission", "Emmissionspegel (dB)", this.noiseLevel, function(val){that.setNoiseLevel(val);}, {textfield: "contextmenu-properties-textfield-numeric"}, "dialog-info-emmission");
	},

	setNoiseLevel: function(n){
		this.noiseLevel = parseFloat(n);
		this.triggerMoveStop();
	},
	
	getMenu: function(){
		this.menu.menu["laermemission"].value = this.noiseLevel;
		
		return this.menu;
	},
	
	getPersistentData: function(){
		var ret = this._super();
		ret.noiseLevel = this.noiseLevel;
		return ret;
	}
		
});