// Used for event handling
// You can multiple functions with add(...)
// They are called upon call(...)

function MultiCallback() {
	this.callback = [];
}


MultiCallback.prototype.add = function(callback){
	this.callback.push(callback);	
}

// install event handler on visibility change of entry
MultiCallback.prototype.call = function(arg){
	if(this.callback)
		for(var i = 0; i < this.callback.length; i ++)
			if(this.callback[i])
				this.callback[i](arg);	
}

