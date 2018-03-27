// Inherits from FloorPlanDynamicObject
// Uses the resize and drag functionality of FloorPlanDynamicObject
// Paints a rect

var FloorPlanDynamicRect = FloorPlanDynamicObject.extend({
	
	init: function(layer, config, data){
		var that = this;
		
		this.draggableH = false;
		this.draggableV = false;
		this.resizeableTop = false;
		this.resizeableLeft = false;
		this.resizeableBottom = false;
		this.resizeableRight = false;

		
		this._super(layer, config, data);

		this.help = "floorplan-help-obstacle";
				
		this.rect = new Kinetic.Rect(
			{
				x: 0,
				y: 0,
				width: this.width,
				height: this.height,
				fill: this.color,
				opacity: this.opacity,
				strokeWidth: 0
			}
		);	
	
		this.dragAnchor.on("click", 
			function(e){
				that.focus();	
			}
		);

		this.type = NoiseCalculator.TYPE_OBSTACLE;
		
		this.contentGroup.add(this.rect);
		
		this.refresh();
	},
		
	setTop: function(m){
		this._super(m);
		if(this.rect)
			this.rect.setHeight(this.height);
	},
	
	setLeft: function(m){
		this._super(m);
		if(this.rect)
			this.rect.setWidth(this.width);
	},
	
	setBottom: function(m){
		this._super(m);
		if(this.rect)
			this.rect.setHeight(this.height);
	},
	
	setRight: function(m){
		this._super(m);
		if(this.rect)
			this.rect.setWidth(this.width);
	},
	
	del: function(){
		this._super();
	},

	rot90: function(){
		var w = this.right - this.left;
		var h = this.bottom - this.top;
		this.setRight(this.left + h);
		this.setBottom(this.top + w);
		var tmp = this.draggableH;
		this.draggableH = this.draggableV;
		this.draggableV = tmp;
		
		tmp = this.resizeableTop;
		this.resizeableTop = this.resizeableLeft;
		this.resizeableLeft = this.resizeableBottom;
		this.resizeableBottom = this.resizeableRight;
		this.resizeableRight = tmp;
		
		this.setResizeDragzones(this.resizeableTop, this.resizeableRight, this.resizeableBottom, this.resizeableLeft);

		if(this.typeStr == "Lärmschutzwand"){
			this.removeRulers();
			this.floorplan.addRulersRoadReceiverWall(this.floorplan.roads, this.floorplan.receivers, this);
		}

		this.refresh();
		this.floorplan.focusElement(this.floorplan);		
	},
		
	getMenu: function(){
		var that = this;
		var menu = this._super();
		menu.addInput("hoehe", "Höhe (m)", this.vHeight, function(val){that.setHeight(val);}, {textfield: "contextmenu-properties-textfield-numeric"}, "floorplan-info-hoehe-obs");
		menu.addButton("loeschen", "90° Drehen", "Drehen", function(){that.rot90();}, {}, "floorplan-info-rot");
		menu.addButton("drehen", "Löschen", "Löschen", function(){that.del();}, {}, "floorplan-info-loeschen");

		return menu;
	},
	
	getPersistentData: function(){
		var d = this._super();
		d.typeStr = this.typeStr;
		d.resizeableTop = this.resizeableTop;
		d.resizeableLeft = this.resizeableLeft;
		d.resizeableBottom = this.resizeableBottom;
		d.resizeableRight = this.resizeableRight;						
		return d;	
	}
	
});