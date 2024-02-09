var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports.name = "parameters";

// Error thrown when a macro's definition is needed, but can't be found.
function CannotFindMacroDef() {};
CannotFindMacroDef.prototype.impossible = true;
CannotFindMacroDef.prototype.name = "macroparam";
// Failed relinks due to missing definitions aren't reported for now.
// I may want to do something special later on.
CannotFindMacroDef.prototype.report = function() { return []; };

exports.report = function(context, macro, callback, options) {
	var managedMacro = context.getMacro(macro.name);
	if (!managedMacro) {
		// We don't manage this macro. Bye.
		return undefined;
	}
	for (var managedArg in managedMacro) {
		var index;
		try {
			index = getParamIndexWithinMacrocall(context, macro.name, managedArg, macro.params, options);
		} catch (e) {
			continue;
		}
		if (index < 0) {
			// The argument was not supplied. Move on to next.
			continue;
		}
		var param = macro.params[index];
		var handler = managedMacro[managedArg];
		var nestedOptions = Object.create(options);
		nestedOptions.settings = context;
		var entry = handler.report(param.value, function(title, blurb, style) {
			var rtn = managedArg;
			if (blurb) {
				rtn += ': "' + blurb + '"';
			}
			callback(title, macro.name + ' ' + rtn, style);
		}, nestedOptions);
	}
};

exports.relink = function(context, macro, text, fromTitle, toTitle, options) {
	var managedMacro = context.getMacro(macro.name);
	var modified = false;
	if (!managedMacro) {
		// We don't manage this macro. Bye.
		return undefined;
	}
	var outMacro = $tw.utils.extend({}, macro);
	var macroEntry = {};
	outMacro.params = macro.params.slice();
	for (var managedArg in managedMacro) {
		var index;
		try {
			index = getParamIndexWithinMacrocall(context, macro.name, managedArg, macro.params, options);
		} catch (e) {
			if (e instanceof CannotFindMacroDef) {
				macroEntry.impossible = true;
				continue;
			}
		}
		if (index < 0) {
			// this arg either was not supplied, or we can't find
			// the definition, so we can't tie it to an anonymous
			// argument. Either way, move on to the next.
			continue;
		}
		var param = macro.params[index];
		var handler = managedMacro[managedArg];
		var nestedOptions = Object.create(options);
		nestedOptions.settings = context;
		var entry = handler.relink(param.value, fromTitle, toTitle, nestedOptions);
		if (entry === undefined) {
			continue;
		}
		// Macro parameters can only be string parameters, not
		// indirect, or macro, or filtered
		if (entry.impossible) {
			macroEntry.impossible = true;
		}
		if (!entry.output) {
			continue;
		}
		var quote = utils.determineQuote(text, param);
		var newParam = $tw.utils.extend({}, param);
		newParam.start = newParam.end - (newParam.value.length + (quote.length*2));
		newParam.value = entry.output;
		newParam.quote = quote;
		newParam.modified = true;
		outMacro.params[index] = newParam;
		modified = true;
	}
	if (modified || macroEntry.impossible) {
		if (modified) {
			macroEntry.output = outMacro;
		}
		return macroEntry;
	}
	return undefined;
};

/** Returns -1 if param definitely isn't in macrocall.
 */
function getParamIndexWithinMacrocall(context, macroName, param, params, options) {
	var index, i, anonsExist = false;
	for (i = 0; i < params.length; i++) {
		var name = params[i].name;
		if (name === param) {
			return i;
		}
		if (name === undefined) {
			anonsExist = true;
		}
	}
	if (!anonsExist) {
		// If no anonymous parameters are present, and we didn't find
		// it among the named ones, it must not be there.
		return -1;
	}
	var expectedIndex = indexOfParameterDef(context, macroName, param, options);
	// We've got to skip over all the named parameter instances.
	if (expectedIndex >= 0) {
		var anonI = 0;
		for (i = 0; i < params.length; i++) {
			if (params[i].name === undefined) {
				if (anonI === expectedIndex) {
					return i;
				}
				anonI++;
			} else {
				var indexOfOther = indexOfParameterDef(context, macroName, params[i].name, options);
				if (indexOfOther < expectedIndex) {
					anonI++;
				}
			}
		}
	}
	return -1;
};

// Looks up the definition of a macro, and figures out what the expected index
// is for the given parameter.
function indexOfParameterDef(context, macroName, paramName, options) {
	var def = context.getMacroDefinition(macroName);
	if (def === undefined) {
		throw new CannotFindMacroDef();
	}
	var params = def.params || [];
	for (var i = 0; i < params.length; i++) {
		if (params[i].name === paramName) {
			return i;
		}
	}
	return -1;
};

