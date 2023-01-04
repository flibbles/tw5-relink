/*\

Methods for reporting and relinking macros. Behaves much like a fieldtype, except that it's not.

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");

// Error thrown when a macro's definition is needed, but can't be found.
function CannotFindMacroDef() {};
CannotFindMacroDef.prototype.impossible = true;
CannotFindMacroDef.prototype.name = "macroparam";
// Failed relinks due to missing definitions aren't reported for now.
// I may want to do something special later on.
CannotFindMacroDef.prototype.report = function() { return []; };

/** As in, report a macrocall invocation that is an html attribute.
 * macro: must be a macro object.*/
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
		var entry = handler.report(param.value, function(title, blurb) {
			var rtn = managedArg;
			if (blurb) {
				rtn += ': "' + blurb + '"';
			}
			callback(title, macro.name + ' ' + rtn);
		}, nestedOptions);
	}
};

/**Processes the given macro,
 * macro: {name:, params:, start:, end:}
 * each parameters: {name:, end:, value:}
 * Macro invocation returned is the same, but relinked, and may have new keys:
 * parameters: {type: macro, start:, newValue: (quoted replacement value)}
 * Output of the returned entry isn't a string, but a macro object. It needs
 * to be converted.
 */
exports.relink = function(context, macro, text, fromTitle, toTitle, mayBeWidget, options) {
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
		var quoted = wrapParameterValue(entry.output, quote);
		var newParam = $tw.utils.extend({}, param);
		if (quoted === undefined) {
			if (!mayBeWidget || !options.placeholder) {
				macroEntry.impossible = true;
				continue;
			}
			var ph = options.placeholder.getPlaceholderFor(entry.output,handler.name);
			newParam.newValue = "<<"+ph+">>";
			newParam.type = "macro";
		} else {
			newParam.start = newParam.end - (newParam.value.length + (quote.length*2));
			newParam.value = entry.output;
			newParam.newValue = quoted;
		}
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

/**Converts the macro object into a string, includes the <<..>>.
 * The text is the old text the macro was formed from. It's used to preserve
 * whitespace.
 */
exports.reassemble = function(macro, text, options) {
	var builder = new Rebuilder(text, macro.start);
	for (var i = 0; i < macro.params.length; i++) {
		var param = macro.params[i];
		if (param.newValue) {
			builder.add(param.newValue, param.start, param.end);
		}
	}
	return builder.results(macro.end);
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

/**Like wrapAttribute value, except for macro parameters, not attributes.
 *
 * These are more permissive. Allows brackets,
 * and slashes and '<' in unquoted values.
 */
function wrapParameterValue(value, preference) {
	var whitelist = ["", "'", '"', '[[', '"""'];
	var choices = {
		"": function(v) {return !/([\s>"'=])/.test(v); },
		"'": function(v) {return v.indexOf("'") < 0; },
		'"': function(v) {return v.indexOf('"') < 0; },
		"[[": canBePrettyOperand,
		'"""': function(v) {return v.indexOf('"""') < 0 && v[v.length-1] != '"';}
	};
	if (choices[preference] && choices[preference](value)) {
		return wrap(value, preference);
	}
	for (var i = 0; i < whitelist.length; i++) {
		var quote = whitelist[i];
		if (choices[quote](value)) {
			return wrap(value, quote);
		}
	}
	// No quotes will work on this
	return undefined;
};

function canBePrettyOperand(value) {
	return value.indexOf(']') < 0;
};


function wrap(value, wrapper) {
	var wrappers = {
		"": function(v) {return v; },
		"'": function(v) {return "'"+v+"'"; },
		'"': function(v) {return '"'+v+'"'; },
		'"""': function(v) {return '"""'+v+'"""'; },
		"[[": function(v) {return "[["+v+"]]"; }
	};
	var chosen = wrappers[wrapper];
	if (chosen) {
		return chosen(value);
	} else {
		return undefined;
	}
};
