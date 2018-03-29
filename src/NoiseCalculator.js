// Does all the sound level computation
// - Sound level at receiver (calculate(...))
// - Directional amount of sound energy (calculate(...))
// - Sound level heat map (calculateHeatmapAdaptive(...))

// Architecture of geometry computation can no longer handle all the requirements and should be reorganized (good luck...)


function NoiseCalculator(rcv, elements){
	this.receiver = rcv;
	this.elements = elements;
	
	this.ok = false;
	this.error = new Array(lang_wait_result);
	
	this.cnt = 0;
	this.reflectionModel = "none";
}

NoiseCalculator.TYPE_OBSTACLE = 1;
NoiseCalculator.TYPE_ROAD = 2;

NoiseCalculator.prototype.init = function(){

}



NoiseCalculator.prototype.calculate = function(phi_min, phi_max,steps, rcv, noreflection){

	this.directional = new Array();
	this.levelRcv = - Number.MAX_VALUE;
	this.accountant = new NoiseAccountant();
	
	// if rcv does not get overridden, take standard rcv
	if(!rcv){
		var rcv = new Object();
		rcv.infinitePos = true;
		rcv.infiniteNeg = false;
		rcv.len = 1;
		rcv.top = this.receiver.getCenterV();
		rcv.left = this.receiver.getCenterH();
		rcv.angle = 0;
		rcv.vHeight = this.receiver.vHeight;
		rcv.centerV = this.receiver.getCenterV();
	}

	var rho = (phi_max - phi_min) / steps;
	var phi = 0, r = 0;
	
	this.check();
					
	for(var i = 0; i < steps; i ++){
		phi = phi_min + rho * i;
		r = this.calculateDirectional(rcv, phi, rho);			
		this.directional.push({phi: phi + rho / 2, r:r});
		this.levelRcv = 10 * Math.log(Math.pow(10, this.levelRcv / 10) + Math.pow(10, r / 10)) / Math.LN10;	
		//console.log(" " + i + ": " + r + " / " + this.levelRcv);	
	}
	
	if(!noreflection)
		if(this.reflectionModel == "buwal1995")
			this.calculateReflectionBUWAL1995();

}

NoiseCalculator.prototype.calculateHeatmap = function(w, h, x_steps, y_steps, phi_steps){
	
	this.heatmap = new Array();
	
	var rcv = new Object();
	rcv.infinitePos = true;
	rcv.infiniteNeg = false;
	rcv.len = 1;
	rcv.vHeight = this.receiver.vHeight;
	rcv.centerV = this.receiver.getCenterV();
	
	for(var x = 0; x < x_steps; x ++){
		this.heatmap[x] = new Array();
		for(var y = 0; y < y_steps; y ++){
			rcv.top = (y + 0.5) * h / y_steps;
			rcv.left = (x + 0.5) * w / x_steps;	
			rcv.centerV = y * h / y_steps;	
			var phi_min = rcv.centerV > this.elements.roads[0].getCenterV() ? Math.PI : 0;
			var phi_max = rcv.centerV > this.elements.roads[0].getCenterV() ? 2 * Math.PI : Math.PI;		
					
			this.calculate(phi_min, phi_max, phi_steps, rcv, true);
			this.heatmap[x][y] = this.levelRcv;		
		}
	}
								
}

NoiseCalculator.prototype.calculateHeatmapAdaptive = function(w, h, x_steps, y_steps, grid0, phi_steps, callback){
	
	this.heatmapCnt = 0;
	this.heatmapSubCnt = 0;
	
	this.heatmap = new Array();

	var th = 5;	
	
	for(var x = 0; x < x_steps + grid0; x += 1){
		this.heatmap[x] = new Array();
		for(var y = 0; y < y_steps + grid0; y += 1){
			this.heatmap[x][y] = -1;
		}
	}
	
	
	var rcv = new Object();
	rcv.infinitePos = true;
	rcv.infiniteNeg = false;
	rcv.len = 1;
	rcv.vHeight = this.receiver.vHeight;

	// calculate initial grid
	for(var x = 0; x < x_steps + grid0; x += grid0){	
		for(var y = 0; y < y_steps + grid0; y += grid0){
	
			var t = this.calculateHeatmapPoint(rcv, w, h, x, y, x_steps, y_steps, phi_steps);
			this.heatmap[x][y] = t;	
		}
	}
	
	var cnt = 0;
	var cntI = 0;
	
	for(var grid = grid0; grid > 1; grid = grid / 2){
		var cnt = 0;
		var cntI = 0;
		
		for(var x = grid; x < x_steps + grid0; x += grid){	
			for(var y = grid; y < y_steps + grid0; y += grid){
				var tl = this.heatmap[x - grid][y - grid];
				var tr = this.heatmap[x][y - grid];	
				var bl = this.heatmap[x - grid][y];
				var br = this.heatmap[x][y];
				
				if(this.heatmapSubCnt > 400){
					this.heatmapSubCnt = 0;
					if(callback)
						callback(this.heatmapCnt / 12000);
				}
											 
				if((Math.abs(tl - tr) > th) || (Math.abs(bl - br) > th) ||
				   (Math.abs(tl - bl) > th) || (Math.abs(tr - br) > th) || 
				   (Math.abs(tl - br) > th) || (Math.abs(tr - bl) > th)
				  )
				{
					// difference to big: calculate full
					var t = 0;
					
					t = this.calculateHeatmapPoint(rcv, w, h, x - grid / 2, y - grid / 2, x_steps, y_steps, phi_steps); // middle
					this.heatmap[x - grid / 2][y - grid / 2] = t;
					
					t = this.calculateHeatmapPoint(rcv, w, h, x - grid, y - grid / 2, x_steps, y_steps, phi_steps); // left
					this.heatmap[x - grid][y - grid / 2] = t;
					
					t = this.calculateHeatmapPoint(rcv, w, h, x, y - grid / 2, x_steps, y_steps, phi_steps); // right				
					this.heatmap[x][y - grid / 2] = t;
					
					t = this.calculateHeatmapPoint(rcv, w, h, x - grid / 2, y - grid, x_steps, y_steps, phi_steps); // top
					this.heatmap[x - grid / 2][y - grid] = t;
					
					t = this.calculateHeatmapPoint(rcv, w, h, x - grid / 2, y, x_steps, y_steps, phi_steps); // bottom
					this.heatmap[x - grid / 2][y] = t;
					
					cnt ++;
					  
				}
				else{
					
					// small difference: just interpolate linearly		
								
					this.heatmap[x - grid / 2][y - grid / 2] = (tl + tr + bl + br) / 4; // middle
					this.heatmap[x - grid][y - grid / 2] = (tl + bl) / 2; // left			
					this.heatmap[x][y - grid / 2] = (tr + br) / 2; // right
					this.heatmap[x - grid / 2][y - grid] = (tl + tr) / 2; // top
					this.heatmap[x - grid / 2][y] = (bl + br) / 2; // bottom
					
					cntI ++;
				}		
			}
		}
		//console.log("Grid " + grid + ": cnt = " + cnt + ", cntI = " + cntI);
	}

    // quick bugfix for some empty values
	for(var i = 0; i < this.heatmap.length; i ++){
	    var a = this.heatmap[i];
		for(var j = 0; j < a.length; j ++){
			if(a[j] < 0){
			    if(j > 0){
			        a[j] = a[j - 1];
                }
                else{
			        // the bug should only occur towards the end of the array
                }
            }
		}
	}
	
								
}

NoiseCalculator.prototype.calculateHeatmapAdaptiveAsync = function(w, h, x_steps, y_steps, grid0, phi_steps, callback){
	
	this.heatmapCnt = 0;
	this.heatmapSubCnt = 0;
	
	this.heatmap = new Array();

	var th = 5;	
	
	for(var x = 0; x < x_steps + grid0; x += 1){
		this.heatmap[x] = new Array();
		for(var y = 0; y < y_steps + grid0; y += 1){
			this.heatmap[x][y] = -1;
		}
	}
	
	
	var rcv = new Object();
	rcv.infinitePos = true;
	rcv.infiniteNeg = false;
	rcv.len = 1;
	rcv.vHeight = this.receiver.vHeight;

	// calculate initial grid
	for(var x = 0; x < x_steps + grid0; x += grid0){	
		for(var y = 0; y < y_steps + grid0; y += grid0){
	
			var t = this.calculateHeatmapPointPush(rcv, w, h, x, y, x_steps, y_steps, phi_steps);
			this.heatmap[x][y] = t;	
		}
	}
	
	var cnt = 0;
	var cntI = 0;
	
	for(var grid = grid0; grid > 1; grid = grid / 2){
		var cnt = 0;
		var cntI = 0;
		
		for(var x = grid; x < x_steps + grid0; x += grid){	
			for(var y = grid; y < y_steps + grid0; y += grid){
				var tl = this.heatmap[x - grid][y - grid];
				var tr = this.heatmap[x][y - grid];	
				var bl = this.heatmap[x - grid][y];
				var br = this.heatmap[x][y];
				
				if(this.heatmapSubCnt > 400){
					this.heatmapSubCnt = 0;
					if(callback)
						callback(this.heatmapCnt / 12000);
				}
											 
				if((Math.abs(tl - tr) > th) || (Math.abs(bl - br) > th) ||
				   (Math.abs(tl - bl) > th) || (Math.abs(tr - br) > th) || 
				   (Math.abs(tl - br) > th) || (Math.abs(tr - bl) > th)
				  )
				{
					// difference to big: calculate full
					var t = 0;
					
					t = this.calculateHeatmapPointPush(rcv, w, h, x - grid / 2, y - grid / 2, x_steps, y_steps, phi_steps); // middle
					this.heatmap[x - grid / 2][y - grid / 2] = t;
					
					t = this.calculateHeatmapPointPush(rcv, w, h, x - grid, y - grid / 2, x_steps, y_steps, phi_steps); // left
					this.heatmap[x - grid][y - grid / 2] = t;
					
					t = this.calculateHeatmapPointPush(rcv, w, h, x, y - grid / 2, x_steps, y_steps, phi_steps); // right				
					this.heatmap[x][y - grid / 2] = t;
					
					t = this.calculateHeatmapPointPush(rcv, w, h, x - grid / 2, y - grid, x_steps, y_steps, phi_steps); // top
					this.heatmap[x - grid / 2][y - grid] = t;
					
					t = this.calculateHeatmapPointPush(rcv, w, h, x - grid / 2, y, x_steps, y_steps, phi_steps); // bottom
					this.heatmap[x - grid / 2][y] = t;
					
					cnt ++;
					  
				}
				else{
					
					// small difference: just interpolate linearly		
								
					this.heatmap[x - grid / 2][y - grid / 2] = (tl + tr + bl + br) / 4; // middle
					this.heatmap[x - grid][y - grid / 2] = (tl + bl) / 2; // left			
					this.heatmap[x][y - grid / 2] = (tr + br) / 2; // right
					this.heatmap[x - grid / 2][y - grid] = (tl + tr) / 2; // top
					this.heatmap[x - grid / 2][y] = (bl + br) / 2; // bottom
					
					cntI ++;
				}
				this.calculateHeatmapPointArray();		
			}
		}
		//console.log("Grid " + grid + ": cnt = " + cnt + ", cntI = " + cntI);
	}

}

NoiseCalculator.prototype.calculateHeatmapPointPush = function(rcv, w, h, x, y, x_steps, y_steps, phi_steps){
	this.heatmapPointJob.push({rcv: rcv, w: w, h: h, x: x, y: y, x_steps: x_steps, y_steps: y_steps, phi_steps: phi_steps});	
}

NoiseCalculator.prototype.calculateHeatmapPointArray = function(rcv, w, h, x, y, x_steps, y_steps, phi_steps){
	for(var i = 0; i < this.heatmapPointJob.lenght; i ++){
		var e = this.heatmapPointJob[i]
		this.calculateHeatmapPoint({rcv: rcv, w: w, h: h, x: x, y: y, x_steps: x_steps, y_steps: y_steps, phi_steps: phi_steps});
	}
}

NoiseCalculator.prototype.calculateHeatmapPoint = function(rcv, w, h, x, y, x_steps, y_steps, phi_steps){
	
	this.heatmapCnt ++;
	this.heatmapSubCnt ++;
	
	rcv.top = (y + 0.5) * h / y_steps;
	rcv.left = (x + 0.5) * w / x_steps;	
	rcv.centerV = y * h / y_steps;

	var valid = true
	
	for(var i = 0; i < this.elements.obstacles.length; i ++){
		valid = valid && !this.elements.obstacles[i].convexIsPointInside(rcv);
	}

	if(valid){
	
		var phi_min = rcv.centerV > this.elements.roads[0].getCenterV() ? Math.PI : 0;
		var phi_max = rcv.centerV > this.elements.roads[0].getCenterV() ? 2 * Math.PI : Math.PI;									

		this.calculate(phi_min, phi_max, phi_steps, rcv, true);
		return this.levelRcv;
	}
	else{
		return -1;
	}
	
}

NoiseCalculator.prototype.setReflectionModel = function(model){
	this.reflectionModel = model;	
}

NoiseCalculator.prototype.getReflectionModel = function(){
	return this.reflectionModel;	
}


NoiseCalculator.prototype.getTotal = function(){
	var r = this.levelRcv;
	if(this.reflectionModel == "buwal1995")
		if(this.reflectionBUWAL1995Valid)
			r += this.reflectionBUWAL1995;
			
	return r;	
}

NoiseCalculator.prototype.getDirectional = function(i){
	return this.directional[i];	
}

NoiseCalculator.prototype.getReflection = function(i){
	if(this.reflectionModel == "buwal1995"){
		if(this.reflectionBUWAL1995Valid)
			return this.reflectionBUWAL1995;
	}

	return 0;
}

NoiseCalculator.prototype.getReflectionError = function(i){
	return this.reflectionError;
}


NoiseCalculator.prototype.getReflectionBUWAL1995Rect = function(i){
	if(this.reflectionBUWAL1995Valid)
		return this.reflectionBUWAL1995Rect;
	else
		return {top: 0, left: 0, width: 0, height: 0};
}

NoiseCalculator.prototype.calculateDirectional = function(rcv, phi, rho){

	var intersections = new Array();

	rcv.angle = phi + rho / 2;
		
	var road = this.elements.roads[0];		
	
	var intRoad = NoiseCalculator.intersect(rcv, road, null, "getRoadVector"); // Hüärä grüüsig!
	
	if(intRoad.length > 0){
		
		intersections = intersections.concat(NoiseCalculator.intersect(rcv, this.elements.obstacles, intRoad));
							
		// Berechnung nach StL-86
		// Beschrieben in der Bedienungsanleitung zu "Programmpaket StL-86", Arbeitsversion 1.5, Empa, 24.09.86
		// (Gelbes Ringheft)
		
		// Kürzester Weg Empfangspunkt-Strasse (räumlich)
		var S = dist(rcv.vHeight - 0.8, rcv.centerV - road.getCenterV());
		
		// Distanz Empfangspunkt-Strasse in diesem Segment (räumlich)
		var r = dist(intRoad[0].d1, rcv.vHeight - 0.8);
		
		// Abstandsdämpfung (gleich für alle Segmente)
		var delta_S = - 10 * log10(S);
		
		// Aspektwinkelverlust (Bogenmass)
		var delta_phi = 10 * log10(rho / Math.PI);
		
		// Luftdämpfung
		var delta_L = - 0.005 * r;
		
		// Bodendämpfung
		var delta_B = - (20  / (1 + (rcv.vHeight + 0.8) / 2)) * (1 - Math.exp(-r / 300));
		
		// Hindernisdämpfung
		var delta_H = 0;
	
		
		// 1. Berechne Hindernishöhe (bislang nur für nächstgelegenes Hindernis)
		
		// 1. Berechne effektive Hindernishöhe (auch für Doppelbeugung)
		
		var h = 0;
		var d = 0;
		var tan_rcv = - 1000000;
		var tan_road = - 1000000;
		var tan_a = 0;
		var maxRcv = null;
		var maxObs = null;
		
		// 1a. Berechne höchsten Winkel vom Empfänger aus
		// 1b. Berechne höchsten Winkel von der Strasse aus	
		for(var i = 0; i < intersections.length; i ++){
			var int = intersections[i];
			if(int.obs.type == NoiseCalculator.TYPE_ROAD){
				break;
			}
			else if(int.obs.type == NoiseCalculator.TYPE_OBSTACLE){
				// a. Berechne Winkel vom Empfänger aus
				tan_a = (int.obs.vHeight - int.rcv.vHeight) / int.d1;
				
				if(tan_a > tan_rcv){
					tan_rcv = tan_a;
					maxRcv = int.obs;
				}
					
				// b. Berechne Winkel von der Strasse aus
				tan_a = (int.obs.vHeight - intRoad[0].obs.vHeight - 0.8) / (intRoad[0].d1 - int.d1);
				
				if(tan_a > tan_road){
					tan_road = tan_a;
					maxObs = int.obs;
				}
			}
		}
			
		// 1c. Berechne Höhe (über null) und Distanz (vom Empfänger)
		h = (
				intRoad[0].d1 * tan_road * tan_rcv
				+ tan_rcv * (intRoad[0].obs.vHeight + 0.8)
				+ tan_road * rcv.vHeight
			) / (tan_road + tan_rcv); 
		
		d = (h - rcv.vHeight) / tan_rcv;
			
		
		// 2. Berechne Umweg
		var QE = dist(intRoad[0].d1, rcv.vHeight - 0.8);
		var QK = dist(intRoad[0].d1 - d, h - 0.8);
		var KE = dist(d, h - rcv.vHeight);
		var w = 0;
		
		if(tan_rcv > (0.8 - rcv.vHeight) / intRoad[0].d1)
			w = QK + KE - QE;
		else
			w = QE - QK - KE;
			
		// 3. Berechne Wirkung
		if(w < -0.0125)
			delta_H = 0;
		else if(w < 0.025)
			delta_H = - 10 * log10(3 + 160 * w);
		else 
			delta_H = - 10 * log10(5 + 80 * w);		
	
		// 4. Limitiere Hinderniswirkung
		if(d < 10){
			if(-delta_H > 25)
				delta_H = - 25;	
		}
		else if(d < 100){
			if(-delta_H > 25 - (d * 5 / 100))
				delta_H = - (25 - (d * 5 / 100));	
		}
		else if(d < 100){
			if(-delta_H > 20)
				delta_H = - 20;	
		}		
		

		//this.accountant.addObstacleLinear(maxRcv, maxObs, 1);
		
		//Dämpfung total
		var delta = delta_S + delta_phi + delta_L + delta_B + delta_H;
		
		//console.log("phi = " + phi + ", r = " + r + ", d = " + delta + ", dS = " + delta_S + ", dPhi = " + delta_phi + ", dL = " + delta_L + ", dB = " + delta_B + ", dH = " + delta_H);
		
		this.accountant.addTotalEnergy(road.noiseLevel + delta);
		this.accountant.addObstacleEnergy(maxRcv, maxObs, road.noiseLevel + delta - delta_H, delta_H);
				   																					 
		return road.noiseLevel + delta;
	}
	else{
		return - Number.MAX_VALUE;
	}
}


NoiseCalculator.prototype.calculateReflectionBUWAL1995 = function(){
	// Berechne Reflexionen nach
	// MITTEILUNGEN ZUR LÄRMSCHUTZ-VERORDNUNG (LSV) NR. 6, BUWAL 1995
	var road = this.elements.roads[0];		
	var rcv = this.receiver;

	// Für die Berechnung der Fahrbahnposition wird angenommen, dass
	// eine Fahrspur 3.2 Meter breit ist. Somit befindet sich die Mitte der Fahrspur 1.6 Meter vom empfängerzugewandten
	// Strassenrand entfernt.
	var a = Math.abs(Math.abs(road.getCenterV() - rcv.getCenterV()) - road.getHeight() / 2 + 1.6);
	var S = dist(a, rcv.vHeight - 0.8);
	
	// first guess of W 	
	var scanner = new Object();
	scanner.infinitePos = true;
	scanner.infiniteNeg = false;
	scanner.len = 1;
	scanner.top = road.getCenterV();
	scanner.left = this.receiver.left;
	scanner.angle = 0;	
	
	var eps = 0.5;
	var roadLen = road.getRight() - road.getLeft();
	
	
	// 1. Berechne die Fassadendistanz für jedes Stückchen der Strasse
	var listE = new Array();
	var listG = new Array();
	
	var int;
	
	for(var i = 0; i < roadLen / eps; i ++){
		scanner.left = i * eps;
			
		scanner.angle = Math.PI / 2; // looking down (receiver)			
		int = NoiseCalculator.intersect(scanner, this.elements.obstacles);
		if(int[0])
			listE.push({w: int[0].obs.getTop() - road.getCenterV(), h: int[0].obs.vHeight});
		else
			listE.push({w: Number.MAX_VALUE, h: 0});

		scanner.angle = - Math.PI / 2; // looking up (opposite);			
		int = NoiseCalculator.intersect(scanner, this.elements.obstacles);
		if(int[0])
			listG.push({w: road.getCenterV() - int[0].obs.getBottom(), h: int[0].obs.vHeight});
		else
			listG.push({w: Number.MAX_VALUE, h: 0});
				
		//console.log(i * eps + ": G (w = " + listG[i].w + ", h = " + listG[i].h + ") E (w = " + listE[i].w + ", h = " + listE[i].h + ")");			
	}


	// 2. Berechne W
	// Heuristischer Ansatz:
	// Berechne den durchschnittlichen Abstand zur Strasse aller Objekte innerhalb eines Abstands von W0 senkrecht
	// zur Strasse und 3 * W0 links und rechts des Empfangspunktes.
	// Annahme: W0 = 30 m (gemäss Kurt Heutschi von der EMPA wurden die Simulationen für Mitteilung 6 mit W < 25 m gemacht)
	
	var W0 = 30;
	var left0 = rcv.left - 3 * W0;
	var sum = 0;
	var cnt = 0;
	
	for(var i = Math.floor(left0 / eps) < 0 ? 0 : Math.floor(left0 / eps); (i < ((left0 + W0 * 6) / eps) && (i < listE.length)); i ++){
		if(listE[i].w < W0 / 2){
			sum += listE[i].w;
			cnt ++;
		}
		if(listG[i].w < W0 / 2){
			sum += listG[i].w;	
			cnt ++;
		}
	}

	// Kein Reflexionszuschlag. Objekte zu weit weg.
	if(cnt == 0){
		this.reflectionBUWAL1995Valid = false;
		this.reflectionBUWAL1995 = 0;
		this.reflectionError = lang_calc_err5;
		return;
	}
	
	var W = 2 * sum / cnt;
	
	//console.log("W = " + W);
		
	// 3. Berechne die Lückenwerte und die durchschnittliche Fassadenhöhe der nicht-Lücken
	// Als nicht-Lücke gelten alle Gebäude, die weniger als das doppelte von der Mitte der äussersten Fahrbahn entfernt 
	// sind als der Durchschnitt der Strassenschlucht. Für die Berechnung der Fahrbahnposition wird angenommen, dass
	// eine Fahrspur 3.2 Meter breit ist. Somit befindet sich die Mitte der Fahrspur 1.6 Meter vom jeweiligen Strassenrand entfernt.
	// Gebäude weiter als 15 Meter von der Strasse entfernt werden in jedem Fall ignoriert.
	// Der Empfangspunkt muss innerhalb dieser Grenze liegen, ansonsten wird die Reflexion als 0 angenommen (siehe 4.)
	
	var maxdist = road.getHeight() / 2 - 1.6 + 2 * (W / 2 - (road.getHeight() / 2 - 1.6));
	maxdist = (maxdist < 15 ? maxdist : 15);
	
	left0 = rcv.left - 3 * W;
	
	var fg = 1, fe = 1;
	
	// In einer Lücke?
	var inG = listG[Math.floor(left0 / eps) < 0 ? 0 : Math.floor(left0 / eps)].w > maxdist;
	var inE = listE[Math.floor(left0 / eps) < 0 ? 0 : Math.floor(left0 / eps)].w > maxdist


	var inGnext, inEnext;

	var lStartE = left0;
	var lStartG = left0;
	

	cnt = 0;
	sum = 0;
	
	var i = 0;
	
	for(i = Math.floor(left0 / eps) < 0 ? 0 : Math.floor(left0 / eps); (i < ((left0 + W * 6) / eps) && (i < listE.length)); i ++){
		inGnext = listG[i].w > maxdist;
		if(!inGnext){
			sum += listG[i].h;
			cnt ++;			
		}
		if(inGnext && inG){
			// nichts	
		}
		else if(!inGnext && inG){
			var tmp = NoiseCalculator.lutFG.getValueNearest([Math.abs(((eps * i + lStartG) / 2 - rcv.left) / W), (eps * i - lStartG) / W]);	
			//console.log("Fg = " + tmp);		
			fg *= tmp;
		}
		else if(inGnext && !inG){
			lStartG = eps * i;
		}
		else{
			// nichts	
		}
		inG = inGnext;
		
		if(Math.floor((left0 + 3 * W) / eps) == i){
			inEnext = false;	
		}
		else{
			inEnext = listE[i].w > maxdist;
		}
		
		if(!inEnext){
			sum += listE[i].h;
			cnt ++;			
		}
		if(inEnext && inE){
			// nichts	
		}
		else if(!inEnext && inE){
			var tmp = NoiseCalculator.lutFE.getValueNearest([Math.abs(((eps * i + lStartE) / 2 - rcv.left) / W), (eps * i - lStartE) / W]);	
			//console.log("Fe = " + tmp);
			fe *= tmp;
		}
		else if(inEnext && !inE){
			lStartE = eps * i;
		}
		else{
			// nichts	
		}
		inE = inEnext;				
	}
	
	if(inG){
		var tmp = NoiseCalculator.lutFG.getValueNearest([Math.abs(((eps * i + lStartG) / 2 - rcv.left) / W), (eps * i - lStartG) / W]);	
		//console.log("Fg = " + tmp);		
		fg *= tmp;
	}
	
	if(inE){
		var tmp = NoiseCalculator.lutFE.getValueNearest([Math.abs(((eps * i + lStartE) / 2 - rcv.left) / W), (eps * i - lStartE) / W]);	
		//console.log("Fe = " + tmp);
		fe *= tmp;	
	}

	var HF = sum / cnt;

	var delta_RGB = NoiseCalculator.lutHFS.getValueNearest([HF / W, S / W]);
	//console.log("delta_RGB = " + delta_RGB);

	var delta_R = delta_RGB * fe * fg;
	
	// 4. Überprüfe, ob der Empfangspunkt innerhalb von maxdist liegt
	
	if(isNaN(delta_R) || (delta_R == 0)){
		this.reflectionError = lang_calc_err1;
	}
	else if(Math.abs(rcv.getCenterV() - road.getCenterV()) > maxdist){
		delta_R = Number.NaN;
		this.reflectionError = lang_calc_err2
	}
	
	if(!isNaN(delta_R)){
		this.reflectionBUWAL1995Valid = true;
		this.reflectionBUWAL1995 = delta_R;
		this.reflectionBUWAL1995Rect = {top: road.getCenterV() - maxdist, left: rcv.left - 3 * W, width: 6 * W, height: 2 * maxdist};
	}
	else{
		this.reflectionBUWAL1995Valid = false;
		this.reflectionBUWAL1995 = 0;
		this.reflectionBUWAL1995Rect = {top: 0, left: 0, width: 0, height: 0};	
	}

	
}

NoiseCalculator.prototype.check = function(){
	// Prüfen, ob die Skizze gültig ist

	this.error = [];
	this.ok = true;

	// 1. Empfänger darf nicht innerhalb eines Hindernisses sein		
	for(var i = 0; i < this.elements.obstacles.length; i ++){
		var e = this.elements.obstacles[i];
	
		if(this.receiver.convexIsOverlappingWith(e)){
			this.error.push(lang_calc_err3(e.name));
			this.ok = false;
		}	
	}
	
	// 2. Empfänger darf nicht innerhalb der Strasse sein
	if(this.receiver.convexIsOverlappingWith(this.elements.roads[0])){
		this.error.push(lang_calc_err6);
		this.ok = false;
	}	
	
	// 3. Hindernisse dürfen sich nicht überlappen
	for(var i = 0; i < this.elements.obstacles.length - 1; i ++){
		var e1 = this.elements.obstacles[i];
		for(var j = i + 1; 	j < this.elements.obstacles.length; j ++){
			var e2 = this.elements.obstacles[j];			
			if(e1.convexIsOverlappingWith(e2)){
				this.error.push(lang_calc_err4(e2.name, e1.name));
				this.ok = false;					
			}		
		}
	}
	
	
}

NoiseCalculator.lutHFS = new LookupTable(
	[
		[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4], // Hf / W
		[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5] // s / W
	],
	[
		[0.5, 1, 1.5, 1.5, 2, 2.5, 2.5, 3, 3, 3, 3, 3, 3, 3, 3],
		[1, 1.5, 1.5, 2, 2.5, 3, 3, 3.5, 3.5, 4, 4, 4, 4, 4, 4],
		[1, 1.5, 2, 2.5, 2.5, 3, 3.5, 3.5, 4, 4, 4.5, 4.5, 4.5, 4.5, 4.5],		
		[1, 1.5, 2, 2.5, 3, 3, 3.5, 4, 4, 4.5, 5, 5, 5, 5, 5],
		[1, 1.5, 2, 2.5, 3, 3.5, 4, 4, 4.5, 4.5, 5, 5.5, 5.5, 6, 6],
		[1, 1.5, 2.5, 2.5, 3, 3.5, 4, 4, 4.5, 5, 5, 5.5, 6, 6, 6.5],
		[1, 2, 2.5, 3, 3.5, 3.5, 4, 4.5, 4.5, 5, 5.5, 5.5, 6, 6.5, 6.5]				
	]	
);

NoiseCalculator.lutFG = new LookupTable(
	[
		[0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4], // kGi / W
		[0.2, 0.4, 0.6, 0.8, 1.0, 2.0, 3.0] // LGi / W

	],
	[
		[0.8, 0.7, 0.5, 0.5, 0.4, 0.2, 0.1],
		[0.9, 0.7, 0.6, 0.5, 0.4, 0.2, 0.1],
		[0.9, 0.8, 0.7, 0.6, 0.5, 0.3, 0.2],
		[0.9, 0.8, 0.8, 0.8, 0.7, 0.5, 0.3],
		[1.0, 0.9, 0.8, 0.8, 0.7, 0.6, 0.5],		
		[1.0, 0.9, 0.9, 0.8, 0.8, 0.6, 0.5],		
		[1.0, 1.0, 0.9, 0.9, 0.9, 0.7, 0.6],		
		[1.0, 1.0, 0.9, 0.9, 0.9, 0.7, 0.6],		
		[1.0, 1.0, 0.9, 0.9, 0.9, 0.7],		
		[1.0, 1.0, 1.0, 0.9, 0.9, 0.8],	
		[1.0, 1.0, 1.0, 1.0, 0.9, 0.8],						
		[1.0, 1.0, 1.0, 1.0, 0.9],
		[1.0, 1.0, 1.0, 1.0, 1.0]													
	]	
);

NoiseCalculator.lutFE = new LookupTable(
	[
		[0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4], // kGi / W
		[0.2, 0.4, 0.6, 0.8, 1.0, 2.0, 3.0] // LGi / W

	],
	[
		[0.9], // eigentlich []
		[0.9],
		[0.9, 0.9, 0.9],
		[1.0, 0.9, 0.9, 0.9, 0.8],
		[1.0, 0.9, 0.9, 0.9, 0.9],		
		[1.0, 0.9, 0.9, 0.9, 0.9, 0.8],		
		[1.0, 0.0, 0.9, 0.9, 0.9, 0.8],		
		[1.0, 1.0, 0.9, 0.9, 0.9, 0.8],		
		[1.0, 1.0, 0.9, 0.9, 0.9, 0.9],		
		[1.0, 1.0, 1.0, 0.9, 0.9, 0.9],	
		[1.0, 1.0, 1.0, 1.0, 1.0, 0.9],						
		[1.0, 1.0, 1.0, 1.0, 0.9],
		[1.0, 1.0, 1.0, 1.0, 1.0]													
	]	
);

NoiseCalculator.intersect = function(rcv, obj, moreIntersections, vecFunc){
	
	var vecs = [];
	
	if(obj instanceof Array){
		
		if(vecFunc)
			vecs = [].concat.apply([], obj.map(function(o){return o[vecFunc]();}));
		else
			vecs = [].concat.apply([], obj.map(function(o){return o.getDefiningVectors();}));			
	}
	else{
		if(vecFunc)
			vecs = obj[vecFunc]();
		else	
			vecs = obj.getDefiningVectors();			
	}
	
	var intersections = new Array();
	
	for(var k = 0; k < vecs.length; k ++){		
		var vec = vecs[k];
		
		//console.log("Intersect (l = " + rcv.left + ", t = " + rcv.top + ", len = " + rcv.len + ", angle = " + rcv.angle + ") and (l = " + vec.left + ", t = " + vec.top + ", len = " + vec.len + ", angle = " + vec.angle + ")");
		
		var x = NoiseCalculator.solve(
					Math.cos(rcv.angle) * rcv.len,
					-Math.cos(vec.angle) * vec.len,
					Math.sin(rcv.angle) * rcv.len,
					-Math.sin(vec.angle) * vec.len,
					- rcv.left + vec.left,
					- rcv.top + vec.top		 
				);
		
		if(
			((rcv.infinitePos || (x.x0 < 1)) && (rcv.infiniteNeg || (x.x0 > 0))) && 
			((vec.infinitePos || (x.x1 < 1)) && (vec.infiniteNeg || (x.x1 > 0)))
		  ){
			intersections.push({d1: x.x0, d2: x.x1, rcv: rcv, obs: vec.obj});
		}
		
		//console.log(" => " + x.x0 + ", " + x.x1);
		
	}

	if(moreIntersections)
		intersections = intersections.concat(moreIntersections);

	
	intersections.sort(
		function(a, b){
			return Math.abs(a.d1) - Math.abs(b.d1);
		}
	);
	
	
	return intersections;
}

NoiseCalculator.solve = function(a, b, c, d, b0, b1){
	var det = (a * d - b * c);
	if(det != 0)
		return {
					x0: (b0 * d + b1 * (-b)) / det, 
					x1: (b0 * (-c) + b1 * (a)) / det
				};
	else
		return {
					x0: Number.POSITIVE_INFINITY, 
					x1: Number.POSITIVE_INFINITY
				};	
}

function NoiseAccountant(){
	this.accounts = new Array();	
	this.totalEnergy = 0;
}

NoiseAccountant.prototype.addTotalEnergy = function(level){
	this.totalEnergy = this.totalEnergy + Math.pow(10, level / 10);	
}

NoiseAccountant.prototype.addObstacleEnergy = function(objA, objB, level, amp){
	var value = Math.pow(10, level/ 10) - Math.pow(10, level / 10) * Math.pow(10, amp / 10);
	this.charge(
		objA, 
		objB,
		value,
		function(a, b){
			return a + b;	
		},
		0
	);	
}

NoiseAccountant.prototype.charge = function(objA, objB, value, func, init){
	if((objA != null) || (objB != null)){	
		for(var k in this.accounts){
			var a = this.accounts[k];
			if(((a.objA == objA) && (a.objB == objB)) || ((a.objA == objB) && (a.objB == objA))){
				a.value = func(a.value, value);
				//console.log(k + ": val = " + value + ", sum = " + a.value);
				return;
			}
		}
		this.accounts.push({objA: objA, objB: objB, value: func(init, value)});
		
	}
	
}

NoiseAccountant.prototype.getList = function(){
	var list = new Array()
	
	//console.log("E_tot = " + this.totalEnergy);
	
	for(var k in this.accounts){
		var a = this.accounts[k];
		
		list.push({
			text: lang_calc_reduction + " " + ((a.objA == a.objB) ? (a.objA.name) : (lang_calc_double_obstacle + " " + a.objA.name + "-" + a.objB.name)),
			value: 10 * Math.log(this.totalEnergy + a.value) / Math.LN10 - 10 * Math.log(this.totalEnergy) / Math.LN10
		});
		
		//console.log(a.objA.name + ": E = " + a.value);
		
	}	
	
	return list;
}


function LookupTable(indices, values){
	this.indices = indices;
	this.values = values;	
}

LookupTable.prototype.getValueNearest = function(idx){
	return this.getValue(
		idx,
		function(a, i, b){
			return (i - a) < (b - i);
		}
		);
}

LookupTable.prototype.getValueFloor = function(idx){
	return this.getValue(
		idx,
		function(a, i, b){
			return i < b;
		}
		);	
}

LookupTable.prototype.getValueCeil = function(idx){
	return this.getValue(
		idx,
		function(a, i, b){
			return i < a;
		}
		);	
}

LookupTable.prototype.getValue = function(idx, func){
	var value = this.values;
	
	//console.log(idx[0] + " " + idx[1]);
	
	for(var i = 0; i < this.indices.length; i ++){
		var t = this.indices[i].length - 1;
		for(var j = 0; j < this.indices[i].length - 1; j ++){
			if(func(this.indices[i][j], idx[i], this.indices[i][j + 1])){
				t = j;
				break;
			}
		}
		if(!value[t])
			value = value[value.length - 1];
		else
			value = value[t];

	}	
	
	
	return value;
}

function log10(x){
	return Math.log(x) / Math.LN10;
}
	
function dist(a, b){
	return Math.sqrt(a * a + b * b);
}