/********************************************************************************/
// # Patch THREE.Object3D
/********************************************************************************/

// handle noConflit.
THREEx.DomEvent.noConflict	= function(){
	THREEx.DomEvent.noConflict.symbols.forEach(function(symbol){
		THREE.Object3D.prototype[symbol]	= THREEx.DomEvent.noConflict.previous[symbol]
	})
}
// Backup previous values to restore them later if needed.
THREEx.DomEvent.noConflict.symbols	= ['on', 'off', 'addEventListener', 'removeEventListener'];
THREEx.DomEvent.noConflict.previous	= {};
THREEx.DomEvent.noConflict.symbols.forEach(function(symbol){
	THREEx.DomEvent.noConflict.previous[symbol]	= THREE.Object3D.prototype[symbol]
})

// begin the actual patching of THREE.Object3D

// create the global instance of THREEx.DomEvent
THREE.Object3D._threexDomEvent	= new THREEx.DomEvent();

// # wrap mouseevents.bind()
THREE.Object3D.prototype.on	=
THREE.Object3D.prototype.addEventListener = function(eventName, callback){
	THREE.Object3D._threexDomEvent.bind(this, eventName, callback);
	return this;
}

// # wrap mouseevents.unbind()
THREE.Object3D.prototype.off	=
THREE.Object3D.prototype.removeEventListener	= function(eventName, callback){
	THREE.Object3D._threexDomEvent.unbind(this, eventName, callback);
	return this;
}
