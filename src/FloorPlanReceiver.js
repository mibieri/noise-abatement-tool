// Represents the receiving point for the noise computation
// Inherits from FloorPlanDynamicObject
// Graphical representation is a spider net diagram and a yellow dot

var FloorPlanReceiver = FloorPlanDynamicObject.extend({
	
	init: function(layer, config, data){
		var that = this;
		
		this._super(layer, config, data);

		this.help = "floorplan-help-receiver";
		this.type = "Empfangspunkt";
		
		this.setTop(this.top - this.pointRadius);
		this.setBottom(this.top + 2 * this.pointRadius);
		this.setLeft(this.left - this.pointRadius);
		this.setRight(this.left + 2 * this.pointRadius);
		
		this.floorplan.onMoveStop(function(){that.calculate();});

		this.calc = new NoiseCalculator(this, this.floorplan);		
				
		this.calc.setReflectionModel(this.reflectionModel ? this.reflectionModel : "none");		


		this.heatmapStepsX = 2 * 120;
		this.heatmapStepsY = 2 * 80;
				
		this.circle = new Kinetic.Circle({
			x: this.pointRadius,
			y: this.pointRadius,
			radius: this.circleRadius,
			fill: '#444444',
			stroke: '#000000',
			strokeWidth: 0.1,
			opacity: 0.3
	  	});
		
		this.point = new Kinetic.Circle({
       		x: this.pointRadius,
        	y: this.pointRadius,
        	radius: this.pointRadius,
			fill: 'yellow',
			opacity: 1.0
      	});

		this.reflectionRect = new Kinetic.Rect(
			{
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				opacity: 0.3,
				fill: "#FFFF00",
				strokeWidth: 0
			}
		);
		
		var tics = 15;
		this.ticGroup = new Kinetic.Group();
		this.txtGroup = new Kinetic.Group({x: 3, y: 3});
		
		var txtscale = 0.1;
		this.txtGroup.setScale(txtscale, txtscale);
		
		for(var i = 0; i < 360 / tics ; i ++){
			var points = 
			[
				this.pointRadius,
				this.pointRadius,
				this.pointRadius + this.circleRadius * Math.cos(i * tics * Math.PI / 180),
				this.pointRadius - this.circleRadius * Math.sin(i * tics * Math.PI / 180)
			];						
			var line = new Kinetic.Line({
       			stroke: '#000000',
        		strokeWidth: 0.1,
        		lineCap: 'round',
        		lineJoin: 'round',
				points: points,
				opacity: 0.3
      		});	
			this.ticGroup.add(line);
		}
		

		for(var i = 1; i < (this.maxLevel - this.minLevel) / this.levelTics; i ++){
			var tic = new Kinetic.Circle({
				x: this.pointRadius,
				y: this.pointRadius,
				radius: i * this.circleRadius / ((this.maxLevel - this.minLevel) / this.levelTics),
				//fill: '#444444',
				stroke: '#000000',
				strokeWidth: 0.1,
				opacity: 0.3
			});
			/*
			Text ergibt sowieso eine sinnlose Angabe.
			var txt = new Kinetic.Text({
				x: 0,
				y: (1 / txtscale) * (0.5 + i * this.circleRadius / ((this.maxLevel - this.minLevel) / this.levelTics)),
				text: i * ((this.maxLevel - this.minLevel) / this.levelTics) + this.minLevel,
				fontSize: 11,
				fill: "#555555",
				fontFamily: "Arial",
				align: "center"
		  	});
			
			this.txtGroup.add(txt);	
			*/				
			this.ticGroup.add(tic);	
		}


		var points = [0, 0, 0, 0];
		
		this.diagramLine = new Kinetic.Line({
			points: points,
        	stroke: 'red',
        	strokeWidth: 0.1,
        	lineCap: 'round',
        	lineJoin: 'round'
      	});		
		
		this.heatmapHeat = new Kinetic.Text({
				x: 0,
				y: 0,
				text: "",
				fontSize: 25,
				fill: "#FFFFFF",
				fontFamily: "Arial",
				align: "center"			
		})
				
		this.ctx = this.floorplan.heatmapLayer.getContext();
		
		this.txtGroup.add(this.heatmapHeat);
		
		this.floorplan.stage.on("mousemove",
			function(e){
				that.mousemoved(e);
			}
		);
		
		this.dragAnchor.on("click", 
			function(e){
				that.focus();
			}
		);	  
		  				  
	  	this.contentGroup.add(this.circle);
		
		this.floorplan.background.add(this.reflectionRect);		
		this.floorplan.overlay.add(this.txtGroup);
		
		this.contentGroup.add(this.ticGroup);
	  	this.contentGroup.add(this.point);		  
		this.contentGroup.add(this.diagramLine);		
			
	  	this.refresh();
	},
	
	
	refresh: function(){
		this._super();
				
	},
	
	diagramFunc: function(phi){
		return Math.abs(7 * Math.cos(phi) /  (Math.cos(phi) + 0.3));	
	},
	
	mousemoved: function(e){
		if(this.heatmapVisible){
			var w = this.floorplan.width * this.floorplan.scale;
			var h = this.floorplan.height * this.floorplan.scale;			
			var hx = Math.floor(e.layerX / (w / this.heatmapStepsX));
			var hy = Math.floor(e.layerY / (h / this.heatmapStepsY));	
						
			var h = this.calc.heatmap[hx][hy];
	
			this.heatmapHeat.setText("Schallpegel bei Mauszeiger: " + Math.floor(h * 10) / 10 + " dB");
		}
		else{
			this.heatmapHeat.setText("");		
		}
	},
	
	getMenu: function(){
		var that = this;
		this.menu = this._super();
		
		
		this.menu.addText("typ", "Typ", "Empfangspunkt", {}, "floorplan-info-typ");
		this.menu.addInput("hoehe", "Höhe (m)", this.vHeight, function(val){that.setHeight(val);}, {textfield: "contextmenu-properties-textfield-numeric"}, "floorplan-info-hoehe");
		this.menu.addOption("refl", "Reflexionsmodell", [{name: "none", label: "Aus", selected: this.calc.getReflectionModel() == "none"}, {name: "buwal1995", label: "BUWAL 1995", selected: this.calc.getReflectionModel() == "buwal1995"}], function(val){that.setReflection(val);}, {}, "floorplan-info-reflexionsmodell");
		this.menu.addButton("laermkarte", "Lärmkarte", "Berechnen", function(){that.calcHeatmap();}, {}, "floorplan-info-laermkarte");
		
		return this.menu;
	},
	
	getResultMenu: function(){
		var that = this;
		
		this.resultMenu = new ContextMenuDescriptor(function(){return that.getResultMenu();});
		
		if(this.calc.ok){
			
			this.resultMenu.addText("level-tot", "Pegel am Empfangspunkt", Math.round(this.calc.getTotal() * 10) / 10 + " dB", {right: "contextmenu-results-right contextmenu-results-main", left: "contextmenu-results-left contextmenu-results-main"}, "floorplan-info-pegel-am-empfangspunkt");	
			
			this.resultMenu.addTitle("title-obs", "Hinderniswirkungen");
								
			if(this.calc.accountant){
				var list = this.calc.accountant.getList();
				if(list.length > 0){
					for(var k in list){
						var e = list[k];
						this.resultMenu.addText("level" + k, e.text, Math.round(e.value * 10) / 10 + " dB", {right: "contextmenu-results-right", left: "contextmenu-results-left"}, "floorplan-info-hindernisreduktion");
					}
				}
				else{
					this.resultMenu.addLine("no-obs", "Es befinden sich keine Schallhindernisse zwischen Empfangspunkt und Strasse.");
				}
			}

			this.resultMenu.addTitle("title-reflex", "Reflexionen");
			
			if(this.calc.getReflectionModel() == "none"){
					this.resultMenu.addLine("no-refl", "Kein Berechnungsmodell für Reflexionen ausgewählt. Klicken Sie auf den Empfangspunkt, um ein Modell zu wählen.");				
			}
			else if(this.calc.getReflection() > 0){
				this.resultMenu.addText("reflection", "Reflexionszuschlag", Math.round(this.calc.getReflection() * 10) / 10 + " dB", {right: "contextmenu-results-right", left: "contextmenu-results-left"}, "floorplan-info-reflexionszuschlag-buwal1995");
				this.resultMenu.addLine("no-refl", "Gelbes Rechteck: Gebiet, das in die Reflexionsberechnung einbezogen wird.");			
			}
			else{
				this.resultMenu.addLine("refl0", this.calc.getReflectionError());	
			}
							
		}
		else{
			for(var i = 0; i < this.calc.error.length; i ++){
				this.resultMenu.addLine("e" + i, this.calc.error[i], {line: "contextmenu-results-line-error"});
			}
		}
		
		return this.resultMenu;
	},	
	
	getHelp: function(){
		return "floorplan-help-receiver";
	},
			
	calculate: function(){
		var that = this;

		var w = this.floorplan.width * this.floorplan.scale;
		var h = this.floorplan.height * this.floorplan.scale;
		var imgData = this.ctx.createImageData(w, h);
		
		if(this.heatmap){
				
			var min = Number.POSITIVE_INFINITY;
			var max = Number.NEGATIVE_INFINITY;
	
			for(var x = 0; x < this.heatmapStepsX; x ++){
				for(var y = 0; y < this.heatmapStepsY; y ++){
					var tmp = this.calc.heatmap[x][y];
					if(tmp != - 1){
						if(tmp < min)
							min = tmp;
						if(tmp > max)
							max = tmp;
					}
				}
			}	
	
			
			for(var x = 0; x < w; x ++){
				for(var y = 0; y < h; y ++){
					var i = 4 * (y * w + x)	
	
					var hx = Math.floor(x / (w / this.heatmapStepsX));
					var hy = Math.floor(y / (h / this.heatmapStepsY));	
					
					var gray = - 0.75 + 1.5 * ((this.calc.heatmap[hx][hy] - min) / (max - min));
					
					var r = JetColormap.red(gray) * 255;
					var g = JetColormap.green(gray) * 255;
					var b = JetColormap.blue(gray) * 255;								
					
								
					imgData.data[i] = Math.floor(r);
					imgData.data[i + 1] = Math.floor(g);
					imgData.data[i + 2] = Math.floor(b);
					imgData.data[i + 3] = 120;
				}
			}
	
			this.ctx.putImageData(imgData, 0, 0);
			
		}
		else{
			this.ctx.putImageData(imgData, 0, 0);
			this.heatmapVisible = false;		
		}
				
		this.heatmap = false;
		
		var steps = 360;
		
		var phi_min = 0;
		var phi_max = 2 * Math.PI;


		this.calc.calculate(phi_min, phi_max, steps);
		var phi = 0, r = 0;
		
		var points = [];
		points.push(this.pointRadius, this.pointRadius);
		
		var x = 0, y = 0;
		
		for(var i = 0; i < steps; i ++){
			phi = this.calc.getDirectional(i).phi;
			r = this.calc.getDirectional(i).r - Math.log(((phi_max - phi_min) / steps) / Math.PI);
			
			if(r < this.minLevel)
				r = 0;
			else if(r > this.maxLevel)
				r = this.circleRadius;
			else
				r = (r - this.minLevel) * this.circleRadius / (this.maxLevel - this.minLevel);
			
			x = this.pointRadius + Math.cos(phi) * r;
			y = this.pointRadius + Math.sin(phi) * r;
			
			points.push(x, y);	
		}
		points.push(this.pointRadius, this.pointRadius);
				
		this.diagramLine.setPoints(points);
		
		if(!this.calc.ok){
			this.circle.setFill('#FF0000');
			this.diagramLine.setOpacity(0.0);
		}
		else{
			this.circle.setFill('#444444');
			this.diagramLine.setOpacity(1.0);		
		}
		
		var rect = this.calc.getReflectionBUWAL1995Rect();

		this.reflectionRect.setY(rect.top);
		this.reflectionRect.setX(rect.left);		
		this.reflectionRect.setHeight(rect.height);
		this.reflectionRect.setWidth(rect.width);	
		
		
		if(this.resultMenu)
			this.resultMenu.refresh();
	},

	getDefiningVectors: function(){
		return new Array(
			{top: this.getCenterV(), left: this.getCenterH(), len: 0.01, angle: 0, infinitePos: false, infiniteNeg: false, obj: this}						
		);
	},
	
	calcHeatmap: function(){
		var that = this;
		this.floorplan.dialogManager.show("floorplan-info-berechne-heatmap", function(){return that.calcHeatmapDialogBuild();});
		window.setTimeout(
			function(){	
				that.calc.calculateHeatmapAdaptive(
					that.floorplan.width, that.floorplan.height, 
					that.heatmapStepsX, that.heatmapStepsY, 16, 60,
					function(x){that.calcHeatmapProgressCallback(x);}
				);
				that.floorplan.triggerMoveStop();	
				that.floorplan.dialogManager.hide();			
			}
		, 10);

		this.heatmap = true;
		this.heatmapVisible = true;
	},
	
	calcHeatmapProgressCallback: function(x){
		if(this.heatmapProgressbar){
			//$("#" + this.heatmapProgressbar).progressbar("option", {value: Math.floor(x * 100)});
		}
	},
	
	calcHeatmapDialogBuild: function(){
		
    	var p =	$("<p/>", {"class" : "dialog-heatmap-progressbar"})
			.append($("<div/>", {"id": "dialog-heatmap-progressbar-1"}).progressbar({
      			value: false,
				max: 100
    		})
		);
		
		this.heatmapProgressbar = "dialog-heatmap-progressbar-1";
		
		return p;
	},
	
	setReflection: function(val){
		this.calc.setReflectionModel(val);
		this.floorplan.triggerMoveStop();
	},
	
	getPersistentData: function(){
		var d = this._super();
		d.top = this.top + this.pointRadius;
		d.left = this.left + this.pointRadius;	
		d.reflectionModel = this.calc.getReflectionModel();
		return d;
	}
	
});


var JetColormap = {
	
	interpolate: function( val, y0, x0, y1, x1 ) {
		return (val-x0)*(y1-y0)/(x1-x0) + y0;
	},
	
	base: function( val ) {
		if ( val <= -0.75 ) return 0;
		else if ( val <= -0.25 ) return JetColormap.interpolate( val, 0.0, -0.75, 1.0, -0.25 );
		else if ( val <= 0.25 ) return 1.0;
		else if ( val <= 0.75 ) return JetColormap.interpolate( val, 1.0, 0.25, 0.0, 0.75 );
		else return 0.0;
	},
	
	red: function( gray ) {
		return JetColormap.base( gray - 0.5 );
	},
	
	green: function( gray ) {
		return JetColormap.base( gray );
	},
	
	blue: function( gray ) {
		return JetColormap.base( gray + 0.5 );
	}
		
}

