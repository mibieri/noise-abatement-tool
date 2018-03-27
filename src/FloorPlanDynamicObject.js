// Inherits from FloorPlanObject
// This object provides dragging and drag-resizing of the object
// This class is basically intended for inheritance by another object
// which specifies a specific look


var FloorPlanDynamicObject = FloorPlanObject.extend({
	
	init: function(layer, config, data){
		var that = this;
		
		this.draggableH = false;
		this.draggableV = false;
		this.resizeableTop = false;
		this.resizeableLeft = false;
		this.resizeableBottom = false;
		this.resizeableRight = false;
		
		this._super(layer, config, data);

		this.controlGroup = new Kinetic.Group();
		this.contentGroup = new Kinetic.Group();

		this.zoneExtension = 1;
				
		this.containingRect = new Kinetic.Rect(
			{
				x: this.resizeableLeft ? this.zoneExtension : 0,
				y: this.resizeableTop ? this.zoneExtension : 0,
				width: this.width - (this.resizeableRight ? this.zoneExtension : 0) - (this.resizeableLeft ? this.zoneExtension : 0),
				height: this.height - (this.resizeableBottom ? this.zoneExtension : 0) - (this.resizeableTop ? this.zoneExtension : 0),
				opacity: 0.0,
				fill: "#00FF00",
				strokeWidth: 0,
				draggable: this.draggableV || this.draggableH
			}
		);	
		
		this.highlightExtension = 0.6;
		
		this.highlightRect = new Kinetic.Rect(
			{
				x: - this.highlightExtension,
				y: - this.highlightExtension,
				width: this.width + 2 * this.highlightExtension,
				height: this.height + 2 * this.highlightExtension,
				opacity: 0.3,
				fill: "#FF0000",
				strokeWidth: 0.1,
				stroke: "#FF0000"
			}
		);		
	
		this.setDragAnchor(this.containingRect);	

		this.setResizeDragzones(this.resizeableTop, this.resizeableRight, this.resizeableBottom, this.resizeableLeft);

		this.controlGroup.add(this.containingRect);

		this.group.add(this.controlGroup);
		this.group.add(this.contentGroup);
		this.controlGroup.add(this.highlightRect);
		this.highlightRect.setZIndex(-1000);
		this.contentGroup.setZIndex(-1000);
				
		this.layer.add(this.group);

	},
	
	setDragAnchor: function(anchor){
		var that = this;
		
		if(this.dragAnchor){
			this.dragAnchor.off("click mouseenter mouseleave dragmove dragstart dragend");
			this.dragAnchor.setDraggable(false);
		}		
		
		this.dragAnchor = anchor;

		this.dragAnchorX0 = this.dragAnchor.getX();
		this.dragAnchorY0 = this.dragAnchor.getY();	
		
		this.dragAnchor.on("mouseenter", function(e){that.cursor("move");});
		
		this.dragAnchor.on("mouseleave", function(e){that.cursor("default");});		
		
		this.dragAnchor.on("dragmove", 
			function(e){
				that.dragmove(this, e);
				that.refresh();	
			}
		);

		this.dragAnchor.on("dragstart", 
			function(e){
				that.dragstart(this, e);
			}
		);

		this.dragAnchor.on("dragend", 
			function(e){
				that.dragstop(this, e);
			}
		);
		
		this.dragAnchor.setDragBoundFunc(
			function(pos){
				return {
            		x: !that.draggableH ? this.getAbsolutePosition().x : pos.x,
            		y: !that.draggableV ? this.getAbsolutePosition().y : pos.y
          		}
			}
		);	
	},
	
	setResizeDragzones: function(t, r, b, l){
		var that = this;
		if(!t){
			if(this.resizeableTopOn)
				this.zoneTop.destroy();	
		}
		else{
			if(!this.resizeableTopOn){
						// *** TOP ***
				this.zoneTop = new Kinetic.Rect(
					{
						x: this.zoneExtension,
						y: - this.zoneExtension,
						width: this.width - 2 * this.zoneExtension,
						height: 2 * this.zoneExtension,
						fill: "#00FFA0",
						strokeWidth: 0,
						draggable: this.resizeableTop,
						opacity: 0.0,
						dragBoundFunc: function(pos) {
							return {
								y: pos.y,
								x: this.getAbsolutePosition().x
							}
						}
			   
					}
				);
		
				this.zoneTop.on("mouseenter", function(e){that.cursor("n-resize"); that.dragAnchor.setDraggable(false);});
				
				this.zoneTop.on("mouseleave", function(e){that.cursor("default"); that.dragAnchor.setDraggable(that.draggableV || that.draggableH);});
				
				this.zoneTop.on("dragstart",
					function(e){
						that.focus();
						that.dragOffset = that.getTop();
						that.triggerMoveStart();
					}
				);	
		
				this.zoneTop.on("dragend",
					function(e){
						that.triggerMoveStop();
					}
				);
				
				this.zoneTop.on("dragmove",
					function(e){
						that.setTop(this.getY() + that.zoneExtension + that.dragOffset);
						that.refresh();
						that.triggerPlanChange();
					}
				);
				this.controlGroup.add(this.zoneTop);
			}
		}
		
		this.resizeableTopOn = t;

	
		if(!r){
			if(this.resizeableRightOn)
				this.zoneRight.destroy();	
		}
		else{
			if(!this.resizeableRightOn){
				// *** RIGHT ***
				this.zoneRight = new Kinetic.Rect(
					{
						x: this.width - this.zoneExtension,
						y: this.zoneExtension,
						width: 2 * this.zoneExtension,
						height: this.height - 2 * this.zoneExtension,
						fill: "#C0FFA0",
						strokeWidth: 0,
						draggable: this.resizeableRight,
						opacity: 0.0,
						dragBoundFunc: function(pos) {
							return {
								x: pos.x,
								y: this.getAbsolutePosition().y
							}
						}      
					}
				);
		
				this.zoneRight.on("mouseenter", function(e){that.cursor("w-resize"); that.dragAnchor.setDraggable(false);});
				
				this.zoneRight.on("mouseleave", function(e){that.cursor("default"); that.dragAnchor.setDraggable(that.draggableV || that.draggableH);});
				
				this.zoneRight.on("dragstart",
					function(e){
						that.focus();
						that.dragOffset = 0;
						that.triggerMoveStart();
					}
				);	
		
		
				this.zoneRight.on("dragend",
					function(e){
						that.triggerMoveStop();
					}
				);
				
				this.zoneRight.on("dragmove",
					function(e){
						that.setRight(this.getX() + that.getLeft() + that.zoneExtension + that.dragOffset);
						that.triggerPlanChange();
						that.refresh();
						
					}
				);
				this.controlGroup.add(this.zoneRight);
			}
		}

		this.resizeableRightOn = r;


		if(!b){
			if(this.resizeableBottomOn)
				this.zoneBottom.destroy();	
		}
		else{
			if(!this.resizeableBottomOn){
				// *** BOTTOM ***	
				this.zoneBottom = new Kinetic.Rect(
					{
						x: this.zoneExtension,
						y: this.height - this.zoneExtension,
						width: this.width - 2 * this.zoneExtension,
						height: 2 * this.zoneExtension,
						fill: "#00FFF0",
						strokeWidth: 0,
						draggable: this.resizeableBottom,
						opacity: 0.0,
						dragBoundFunc: function(pos) {
							return {
								y: pos.y,
								x: this.getAbsolutePosition().x
							}
						}       
					}
				);
		
				this.zoneBottom.on("mouseenter", function(e){that.cursor("s-resize"); that.dragAnchor.setDraggable(false);});
				
				this.zoneBottom.on("mouseleave", function(e){that.cursor("default"); that.dragAnchor.setDraggable(that.draggableV || that.draggableH);});
				
				this.zoneBottom.on("dragstart",
					function(e){
						that.focus();
						that.dragOffset = 0;
						that.triggerMoveStart();
					}
				);	
		
				this.zoneBottom.on("dragend",
					function(e){
						that.triggerMoveStop();
					}
				);
				
				this.zoneBottom.on("dragmove",
					function(e){
						that.setBottom(this.getY() + that.getTop() + that.zoneExtension + that.dragOffset);
						that.refresh();
						that.triggerPlanChange();
					}
				);
				this.controlGroup.add(this.zoneBottom);
			}
		}

		this.resizeableBottomOn = b;


		if(!l){
			if(this.resizeableLeftOn)
				this.zoneLeft.destroy();	
		}
		else{
			if(!this.resizeableLeftOn){
// *** LEFT ***
				this.zoneLeft = new Kinetic.Rect(
					{
						x: - this.zoneExtension,
						y: this.zoneExtension,
						width: 2 * this.zoneExtension,
						height: this.height - 2 * this.zoneExtension,
						fill: "#C0FFA0",
						strokeWidth: 0,
						draggable: this.resizeableLeft,
						opacity: 0.0,
						dragBoundFunc: function(pos) {
							return {
								x: pos.x,
								y: this.getAbsolutePosition().y
							}
						}
					}
				);
		
				this.zoneLeft.on("mouseenter", function(e){that.cursor("e-resize"); that.dragAnchor.setDraggable(false);});
				
				this.zoneLeft.on("mouseleave", function(e){that.cursor("default"); that.dragAnchor.setDraggable(that.draggableV || that.draggableH);});
				
				this.zoneLeft.on("dragstart",
					function(e){
						that.focus();
						that.dragOffset = that.getLeft();
						that.triggerMoveStart();
					}
				);	
		
				this.zoneLeft.on("dragend",
					function(e){
						that.triggerMoveStop();
					}
				);
				
				this.zoneLeft.on("dragmove",
					function(e){
						that.setLeft(this.getX() + that.zoneExtension + that.dragOffset);
						that.refresh();
						that.triggerPlanChange();
					}
				);										
				this.controlGroup.add(this.zoneLeft);	
			}
		}
		
		this.resizeableLeftOn = l;		
	},
	
	
	refresh: function(){
		if(this.zoneTop){
			this.zoneTop.setX(this.zoneExtension);
			this.zoneTop.setY(- this.zoneExtension);
			this.zoneTop.setWidth(this.width - 2 * this.zoneExtension);
		}

		if(this.zoneBottom){		
			this.zoneBottom.setX(this.zoneExtension);
			this.zoneBottom.setY(this.height - this.zoneExtension);	
			this.zoneBottom.setWidth(this.width - 2 * this.zoneExtension);
		}

		if(this.zoneLeft){				
			this.zoneLeft.setX(- this.zoneExtension);
			this.zoneLeft.setY(this.zoneExtension);	
			this.zoneLeft.setHeight(this.height - 2 * this.zoneExtension);		
		}
		
		if(this.zoneRight){		
			this.zoneRight.setX(this.width - this.zoneExtension);
			this.zoneRight.setY(this.zoneExtension);
			this.zoneRight.setHeight(this.height - 2 * this.zoneExtension);
		}
		
		this.containingRect.setX(this.resizeableLeft ? this.zoneExtension : 0);
		this.containingRect.setY(this.resizeableTop ? this.zoneExtension : 0);			
										
		this.containingRect.setHeight(
			this.height - (this.resizeableBottom ? this.zoneExtension : 0) 
			- (this.resizeableTop ? this.zoneExtension : 0)
		);
		
		this.containingRect.setWidth(
			this.width - (this.resizeableRight ? this.zoneExtension : 0) 
			- (this.resizeableLeft ? this.zoneExtension : 0)
		);

		if(this.highlighted)
			this.highlightRect.setOpacity(0.3);
		else
			this.highlightRect.setOpacity(0.0);

		this.highlightRect.setHeight(
			this.height + 2 * this.highlightExtension
		);
		
		this.highlightRect.setWidth(
			this.width + 2 * this.highlightExtension
		);
		
		this.triggerPlanChange();			
	},
	
	dragstart: function(target, event){
		this.dragOffsetX = this.left;
		this.dragOffsetY = this.top;
		this.focus();
		this.triggerMoveStart();		
	},
	
	dragmove: function(target, event){		
		this.moveTopTo(this.dragOffsetY + target.getY() - this.dragAnchorY0);
		this.moveLeftTo(this.dragOffsetX + target.getX() - this.dragAnchorX0);		
		this.triggerPlanChange();
	},

	dragstop: function(target, event){		
		this.dragAnchor.setX(this.dragAnchorX0);
		this.dragAnchor.setY(this.dragAnchorY0);
		this.triggerMoveStop();		
	},	
	
	paint: function(){
		this.containingRect.setWidth(this.width);
		this.containingRect.setHeight(this.height);
	},
	
	cursor: function(cursor){
		if(this.floorplan)
			this.floorplan.cursor(cursor);	
	}
		
});