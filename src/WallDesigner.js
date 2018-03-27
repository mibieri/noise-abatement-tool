// The main container of everything
// Instantiates FloorPlan and all the toolboxes and menues

function WallDesigner(container){
	var that = this;
	// if browser is to old, program will stop here
	// quick and dirty...
	if(!BrowserDetect.isCompatible()){
		$("#floorplan-maincontainer").empty();
		var d = DialogManager.create("body", "floorplan-info-container");
		d.show("floorplan-info-browser-old");
		return;
	}else{
		$.getScript('../js/kineticjs433.js', 
			function() {
           		that.init();
        	}
		);
	}
	
	this.container = container;
}

WallDesigner.prototype.init = function(){
	
	var that = this;
	
	this.element = $("#" + this.container);
	
	this.tools = $("<div/>", 
		{
			"id" : "floorplan-tools"
		}
	);

	this.toolResults =$("<div/>", 
		{
			"id" : "floorplan-tool-results",
			"class" : "floorplan-tool"
		}
	);

	this.toolResultsContainer = $("<div/>",
		{
			"id" : "floorplan-tool-results-container",
			"class" : "floorplan-tool-container"
		}
	);
	
	this.toolResults.append(this.toolResultsContainer);
				
	this.toolProperties =$("<div/>", 
		{
			"id" : "floorplan-tool-properties",
			"class" : "floorplan-tool"
		}
	);
	
	this.toolPropertiesContainer = $("<div/>",
		{
			"id" : "floorplan-tool-properties-container",
			"class" : "floorplan-tool-container"
		}
	);
	
	this.toolProperties.append(this.toolPropertiesContainer);
	
	this.toolHelp =$("<div/>", 
		{
			"id" : "floorplan-tool-help",
			"class" : "floorplan-tool"
		}
	);
	
	this.toolHelpContainer = $("<div/>",
		{
			"id" : "floorplan-tool-help-container",
			"class" : "floorplan-tool-container"
		}
	);
	
	this.toolHelp.append(this.toolHelpContainer);
	
	this.canvas = $("<div/>", 
		{
			"id" : "floorplan-canvas"
		}
	);

	this.tools.append("<div class=\"contextmenu-properties-line contextmenu-properties-title\">Resultate</div>");	
	this.tools.append(this.toolResults);
	
	this.tools.append("<div class=\"contextmenu-properties-line contextmenu-properties-title\">Optionen</div>");
	this.tools.append(this.toolProperties);
	this.tools.append("<div class=\"contextmenu-properties-line contextmenu-properties-title\">Hilfe</div>");
	
	
	this.tools.append(this.toolHelp);	
	
	this.element.append(this.tools);
	this.element.append(this.canvas);
	
	this.floorPlan = new FloorPlan("floorplan-canvas");
	this.floorPlan.onFocusElement(function(element){that.focusElement(element);});
	this.floorPlan.onMoveStop(function(element){that.save();});
	
	this.resultsMenu = new ContextMenu("floorplan-tool-results-container");
	this.contextMenu = new ContextMenu("floorplan-tool-properties-container");
	this.helpMenu = new ContextMenu("floorplan-tool-help-container");
	
	this.dialogManager = DialogManager.create("floorplan", "floorplan-info-container");
	
	this.resultsMenu.dialogManager = this.dialogManager;
	this.contextMenu.dialogManager = this.dialogManager;
	
	this.initFloorplan();	
	this.floorPlan.dialogManager = this.dialogManager;
	
	this.resultsMenu.setMenu(this.floorPlan.getActiveReceiver().getResultMenu());
	
	var d = [];
	if(!BrowserDetect.isChrome()){
		d.push("floorplan-info-browser-nochrome");
	}
	
	d.push("floorplan-info-willkommen");
		
	this.dialogManager.showArray(d);
	this.setHelp("floorplan-help-start");	
}

WallDesigner.prototype.initFloorplan = function(element){
	$.cookie.json = true;
	var data = $.cookie("wall-designer");
	
	this.floorPlan.loadFromPersistent(data);	

}

WallDesigner.prototype.setHelp = function(id){
	var menu = new ContextMenuDescriptor();
	menu.addHelp("help", id);
	this.helpMenu.setMenu(menu);
}

WallDesigner.prototype.focusElement = function(element){
	this.focussed = element;
	this.contextMenu.setMenu(element.getMenu());
	this.setHelp(element.getHelp());
}

WallDesigner.prototype.save = function(){
	var data = this.floorPlan.getPersistentData();
	$.cookie.json = true;
	$.cookie("wall-designer", data);
}


