// Fully automatic ruler
// Ruler can be attached to any FloorPlanObject

function Ruler(layer, scale, a, aRef, aOn, b, bRef, bOn, anchObj, anchRef, anchOffset){
	var that = this;
	
	this.layer = layer;
	this.group = new Kinetic.Group();
	
	this.objA = a;
	this.objB = b;
	
	this.refA = aRef;
	this.refB = bRef;
	
	this.aOn = aOn;
	this.bOn = bOn;
	
	this.anchObj = anchObj;
	this.anchRef = anchRef;
	this.anchOffset = anchOffset;
	
	if(this.aOn)
		this.objA.addRuler(this);
	
	if(this.bOn && (this.objA != this.objB))
		this.objB.addRuler(this);		
		
	this.anchObj.onPlanChange(function(){that.planChanged();});	
	
	this.scale = scale;
	
	this.cnt = 0;
	
	this.init();
	this.refresh();
}

Ruler.TOP = 1;
Ruler.RIGHT = 2;
Ruler.BOTTOM = 3;
Ruler.LEFT = 4;
Ruler.CENTERV = 5;
Ruler.CENTERH = 6;
Ruler.AUTOV = 7;
Ruler.AUTOH = 8;

Ruler.prototype.init = function(){
		
	this.ruler = new Kinetic.Line(
		{
			points: [100, 100, 400, 400],
        	stroke: "#CC2222",
        	strokeWidth: 2,
			opacity: 0.8
		}
	);

	this.text = new Kinetic.Text(
		{
			fontSize: 12,
			fontFamily: 'Calibri',
			fill: "#CC2222",
			opacity: 0.8
		}
	);
			
	this.group.add(this.ruler);
	this.group.add(this.text);
}

Ruler.prototype.refresh = function(){
	var vertical = false;
	
	if((this.refA == Ruler.TOP) || (this.refA == Ruler.BOTTOM) || (this.refA == Ruler.CENTERV) || (this.refA == Ruler.AUTOV))
		vertical = true;
	
	
		
	var nPos = this.getPos(this.anchObj, this.anchRef) + this.anchOffset;

	var pStart, pEnd;
	var a, b, c, d;

	if((this.refA == Ruler.AUTOV) || (this.refB == Ruler.AUTOV)){
		a = this.getPos(this.objA, this.refA == Ruler.AUTOV ? Ruler.TOP : this.refA);
		b = this.getPos(this.objA, this.refA == Ruler.AUTOV ? Ruler.BOTTOM : this.refA);
		c = this.getPos(this.objB, this.refB == Ruler.AUTOV ? Ruler.TOP : this.refB);
		d = this.getPos(this.objB, this.refB == Ruler.AUTOV ? Ruler.BOTTOM : this.refB);
		if(c > b){
			pStart = b;
			pEnd = c;
		}
		else if(a > d){
			pStart = a;
			pEnd = d;	
		}
		else{
			if(Math.abs(a - c) < Math.abs(b - d)){
				pStart = a;
				pEnd = c;
			}
			else{
				pStart = b;
				pEnd = d;				
			}
		}
	}
	else if((this.refA == Ruler.AUTOH) || (this.refB == Ruler.AUTOH)){
		a = this.getPos(this.objA, this.refA == Ruler.AUTOH ? Ruler.LEFT : this.refA);
		b = this.getPos(this.objA, this.refA == Ruler.AUTOH ? Ruler.RIGHT : this.refA);
		c = this.getPos(this.objB, this.refB == Ruler.AUTOH ? Ruler.LEFT : this.refB);
		d = this.getPos(this.objB, this.refB == Ruler.AUTOH ? Ruler.RIGHT : this.refB);
		if(c > b){
			pStart = b;
			pEnd = c;
		}
		else if(a > d){
			pStart = a;
			pEnd = d;	
		}
		else{
			if(Math.abs(a - c) < Math.abs(b - d)){
				pStart = a;
				pEnd = c;
			}
			else{
				pStart = b;
				pEnd = d;				
			}
		}
	}	
	else{
		pStart = this.getPos(this.objA, this.refA);
		pEnd = this.getPos(this.objB, this.refB);
	}
	
	
	var len = Math.abs(pEnd - pStart);
	
	var points = []
	
	pStart = this.scale * pStart;
	pEnd = this.scale * pEnd;
	nPos = this.scale * nPos;
	
	var endLen = 10;
	
	if(vertical){
		points = 
		[
			[nPos - endLen, pStart],
			[nPos + endLen, pStart],
			[nPos, pStart],
			[nPos, pEnd],
			[nPos + endLen , pEnd],
			[nPos - endLen, pEnd]			
		];
	}
	else{
		points = 
		[
			[pStart, nPos - endLen],
			[pStart, nPos + endLen],
			[pStart, nPos],
			[pEnd, nPos, pEnd],
			[pEnd, nPos + endLen],
			[pEnd, nPos - endLen]			
		];		
	}
		
	this.ruler.setPoints(points);		
	
	this.cnt ++;
	
	this.text.setText((Math.round(len * 10) / 10) + " m");
	
	if(vertical){
		this.text.setOffset({
			y: this.text.getHeight() / 2
		});
		this.text.setX(nPos + 10);
		this.text.setY((pStart + pEnd) / 2);
	}
	else{
		this.text.setOffset({
			x: this.text.getWidth() / 2
		});
		this.text.setY(nPos + 7);
		this.text.setX((pStart + pEnd) / 2);
	}
		
}

Ruler.prototype.getPos = function(o, ref){
	if(ref == Ruler.TOP)
		return o.getTop();
	else if(ref == Ruler.LEFT)
		return o.getLeft();
	else if(ref == Ruler.BOTTOM)
		return o.getBottom();
	else if(ref == Ruler.RIGHT)
		return o.getRight();
	else if(ref == Ruler.CENTERV)
		return o.getCenterV();
	else if(ref == Ruler.CENTERH)
		return o.getCenterH();
	else 
		return 0;										
}

Ruler.prototype.del = function(){
	this.objA.removeRuler(this);
	this.objB.removeRuler(this);
	this.moveStopped();
}

Ruler.prototype.planChanged = function(){
	this.refresh();	
}

Ruler.prototype.moveStarted = function(){
	//console.log("MoveStarted");
	this.layer.add(this.group);
	this.refresh();
}

Ruler.prototype.moveStopped = function(){
	//console.log("MoveStopped");
	this.layer.removeChildren();
}
