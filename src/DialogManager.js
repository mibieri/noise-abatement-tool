// Manages displaying of dialogs which are defined as HTML elements and accessed via their ID.

DialogManager.list = new Array

DialogManager.create = function(displayContainer, sourceContainer){
	var d = new DialogManager(displayContainer, sourceContainer);
	DialogManager.list.push(d);
	return d;
}

function DialogManager(displayContainer, sourceContainer){
	var that = this;
	
	this.displayContainer = displayContainer;
	this.sourceContainer = sourceContainer;
	
	this.init();
}

DialogManager.prototype.init = function(){
	
}

DialogManager.prototype.showArray = function(arr){
	this.arr = arr;
	this.show(arr[0]);
}

DialogManager.prototype.show = function(id, buildFunc){
		
	var that = this;
	
	this.hide();
	
	this.overlay = $("<div/>", 
		{
			"class" : "dialog-overlay"
		}
	);
	
	var width = $(window).width();
	var height = $(window).height();
	
	this.overlay.width(width);
	this.overlay.height(height);
	
	$("body").append(this.overlay);

	this.current = $("#" + this.sourceContainer + " #" + id).clone();
	
	this.current.css("display", "block");

	if(buildFunc){
		var t = buildFunc();
		this.current.append(t);	
	}
	
	var close = $("<div/>",
		{
			"class" : "dialog-close"
		})
	.append("Schliessen")
	.click(function(){that.hide();});
		
	this.current.append(close);
	
	$("body").append(this.current);	
			
	this.current.position({
		my: "center",
		at: "center",
		of: "#" + this.displayContainer
	});		


	
}

DialogManager.prototype.hide = function(){	
	if(this.current){
		this.current.remove();
		this.overlay.remove();
		this.current = null;

		if(this.arr && (this.arr instanceof Array) && (this.arr.length > 1)){
			this.arr.shift();
			this.show(this.arr[0]);
		}
		
	}
	
}


