// A menu which can be displayed according to what the user is currently doing

function ContextMenu(container){
	
	this.container = container;
	
	this.element = $("#" + this.container);
	
	this.init();
}

ContextMenu.prototype.init = function(){

}

ContextMenu.prototype.refresh = function(){
	if(this.menu.getCallback)
		this.setMenu(this.menu.getCallback());
}

ContextMenu.prototype.setMenu = function(menu){
	
	var that = this;	 
	
	if(this.menu)
		this.menu.disable();
	
	this.menu = menu;
	
	this.menu.enable();
	
	menu.onRefresh(function(){that.refresh();});
	
	var that = this;	 
	var menu = this.menu;
		
	this.element.empty();
	
	for(var l in menu.menu){
		var info = null;
		if(menu.menu[l].type == ContextMenuDescriptor.HELP){
			if(menu.menu[l].label){
				var help = $("#" + menu.menu[l].label).clone();
				help.find("[href^=\"help://\"]").each(
					function(i){
						var cmd = new ContextMenuDescriptor();
						cmd.addHelp("help", $(this).attr("href").substring(7));	
						$(this).click(
							function(){
								that.setMenu(cmd);
							});
						$(this).attr("href", "javascript: void(0)");
					}
					
				);
				
				var prev = help.find("a#floorplan-help-previous").html("zurück");
				var next = help.find("a#floorplan-help-next").html("weiter");
				
				var div = $("<div/>", {"class" : "floorplan-help-nav"});
				div.append(prev);
				div.append(" | ");
				div.append(next);
				help.append(div);
				this.element.append(help);			
			}
		}
		else if(menu.menu[l].type == ContextMenuDescriptor.LINE){
			var line = $("<div/>", 
				{
					"class" : "contextmenu-properties-line " + (menu.menu[l].classes.line ? menu.menu[l].classes.line : "")	
				}
			);
			line.append(menu.menu[l].label);
			this.element.append(line);			
		}
		else if(menu.menu[l].type == ContextMenuDescriptor.TITLE){
			var line = $("<div/>", 
				{
					"class" : "contextmenu-properties-line contextmenu-properties-subtitle " + (menu.menu[l].classes.title ? menu.menu[l].classes.title : "")	
				}
			);
			line.append(menu.menu[l].label);
			this.element.append(line);			
		}
		else{
			var line = $("<div/>", 
				{
					"class" : "contextmenu-properties-line " + (menu.menu[l].classes.line ? menu.menu[l].classes.line : "")		
				}
			);
			
			var left = $("<div/>", 
				{
					"class" : "contextmenu-properties-left " + (menu.menu[l].classes.left ? menu.menu[l].classes.left : "")	
				}
			).append(menu.menu[l].label);
	
			var right = $("<div/>", 
				{
					"class" : "contextmenu-properties-right " + (menu.menu[l].classes.right ? menu.menu[l].classes.right : "")		
				}
			)
			if(menu.menu[l].info){
				info = $("<div/>", 
					{
						"class" : "contextmenu-properties-info " + (menu.menu[l].classes.info ? menu.menu[l].classes.info : "")		
					}
				)
				.append($("<a/>", 
					{
						"href" : "javascript: void(0)",
						"class" : "icon-info-sign"
					}
				).click(
					(function(t){
						return function(){
							that.dialogManager.show(t);
						}
					})(menu.menu[l].info))
					.append("")
				);
			}
			
			if(menu.menu[l].type == ContextMenuDescriptor.TEXT){
				right.append(menu.menu[l].value);
			}
			else if(menu.menu[l].type == ContextMenuDescriptor.INPUT){
				var t = $("<input/>", 
					{
						"class" : "contextmenu-properties-textfield " + (menu.menu[l].classes.textfield ? menu.menu[l].classes.textfield : ""),
						"type" : "text",
						"value" : menu.menu[l].value
					}
				);
	
				t.change(
					(function(callback, t){
						return function(){
							callback(t.val());
						}
					})(menu.menu[l].callback, t)
				);
					
				right.append(t);
			}
			else if(menu.menu[l].type == ContextMenuDescriptor.BUTTON){
				var b = $("<input/>", 
					{
						"class" : "contextmenu-properties-button " + (menu.menu[l].classes.button ? menu.menu[l].classes.button : ""),
						"type" : "button",
						"value" : menu.menu[l].value
					}
				);
				
				b.click(
					(function(callback){
						return function(){
							callback();
						}
					})(menu.menu[l].callback)
				);
					
				right.append(b);
			}	
			else if(menu.menu[l].type == ContextMenuDescriptor.OPTION){
				var b = $("<select/>", 
					{
						"class" : "contextmenu-properties-option " + (menu.menu[l].classes.option ? menu.menu[l].classes.option : "")
					}
				);
				
				for(var k in menu.menu[l].value){
					var v = menu.menu[l].value[k];
					var o = $("<option/>", 
						{
							"value" : v.name
						}
					);
					if(v.selected)
						o.attr("selected", "selected");
					o.append(v.label);
					b.append(o);
				}
				
				b.change(
					(function(callback){
						return function(){
							callback($(this).val());
						}
					})(menu.menu[l].callback)
				);
					
				right.append(b);
			}							
			line.append(left).append(right)
			if(info)
				line.append(info);
			this.element.append(line);
		}	
	}
}

function ContextMenuDescriptor(getCallback){
	this.getCallback = getCallback;
	this.menu = new Object();	
}

ContextMenuDescriptor.TITLE = 1;
ContextMenuDescriptor.LINE = 2;
ContextMenuDescriptor.TEXT = 3;
ContextMenuDescriptor.INPUT = 4;
ContextMenuDescriptor.BUTTON = 5;
ContextMenuDescriptor.OPTION = 6;
ContextMenuDescriptor.HELP = 7;

ContextMenuDescriptor.prototype.enable = function(){
	this.enabled = true;
}

ContextMenuDescriptor.prototype.disable = function(){
	this.enabled = false;	
}

ContextMenuDescriptor.prototype.onRefresh = function(c){
	this.refreshCallback = c;	
}

ContextMenuDescriptor.prototype.refresh = function(){
	if(this.enabled && this.refreshCallback)
		this.refreshCallback();
}

ContextMenuDescriptor.prototype.addTitle = function(name, label, classes){
	
	this.menu[name] = new Object();
		
	this.menu[name].label = label;
	this.menu[name].type = ContextMenuDescriptor.TITLE
	this.setClasses(this.menu[name], classes);
}

ContextMenuDescriptor.prototype.addLine = function(name, label, classes, info){
	
	this.menu[name] = new Object();
		
	this.menu[name].label = label;
	this.menu[name].type = ContextMenuDescriptor.LINE
	this.menu[name].info = info;
	this.setClasses(this.menu[name], classes);
}

ContextMenuDescriptor.prototype.addText = function(name, label, value, classes, info){
	
	this.menu[name] = new Object();
		
	this.menu[name].label = label;
	this.menu[name].value = value;
	this.menu[name].callback = null;
	this.menu[name].type = ContextMenuDescriptor.TEXT;
	this.menu[name].info = info;	
	this.setClasses(this.menu[name], classes);
}

ContextMenuDescriptor.prototype.addInput = function(name, label, value, onchange, classes, info){

	this.menu[name] = new Object();	

	this.menu[name].label = label;
	this.menu[name].value = value;
	this.menu[name].callback = onchange;
	this.menu[name].type = ContextMenuDescriptor.INPUT;
	this.menu[name].info = info;	
	this.setClasses(this.menu[name], classes);
}

ContextMenuDescriptor.prototype.addButton = function(name, label, value, onclick, classes, info){

	this.menu[name] = new Object();	
	
	this.menu[name].label = label;
	this.menu[name].value = value;
	this.menu[name].callback = onclick;
	this.menu[name].type = ContextMenuDescriptor.BUTTON;
	this.menu[name].info = info;	
	this.setClasses(this.menu[name], classes);
}

ContextMenuDescriptor.prototype.addOption = function(name, label, value, onclick, classes, info){

	this.menu[name] = new Object();	
	
	this.menu[name].label = label;
	this.menu[name].value = value;
	this.menu[name].callback = onclick;
	this.menu[name].type = ContextMenuDescriptor.OPTION;
	this.menu[name].info = info;	
	this.setClasses(this.menu[name], classes);
}

ContextMenuDescriptor.prototype.addHelp = function(name, id, classes){

	this.menu[name] = new Object();	
	this.menu[name].label = id;
	this.menu[name].type = ContextMenuDescriptor.HELP;
	this.setClasses(this.menu[name], classes);	
}

ContextMenuDescriptor.prototype.setClasses = function(target, classes){
	target.classes = new Object();
	for(var k in classes){
		var c = classes[k];
		target.classes[k] = c;
	}
}
