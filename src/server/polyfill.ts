if (!Object.fromEntries) {
	Object.fromEntries = function fromEntries(pairs: [string, any][]) { // 'pairs' is not used in function, but will help function users to know that this function accepts arguments.
		// Define an empty object.
		var rv: Record<string, any> = {};

		// Go through all function arguments
		pairs.forEach(function(e){
			rv[e[0]] = e[1];
		});

		//Return converted object.
		return rv;
	};
}

export default null;