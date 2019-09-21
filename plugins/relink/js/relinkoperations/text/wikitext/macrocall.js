/*\
module-type: relinkwikitextrule

Handles macro calls.

<<myMacro '[[MyFilter]]' 'myTitle'>>

\*/

var utils = require("./utils.js");
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var CannotFindMacroDefError = require("$:/plugins/flibbles/relink/js/errors.js").CannotFindMacroDefError;

exports.name = ["macrocallinline", "macrocallblock"];

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	// Get all the details of the match
	var macroName = this.match[1],
		paramString = this.match[2],
		macroText = this.match[0];
	// Move past the macro call
	this.parser.pos = this.matchRegExp.lastIndex;
	var start = this.matchRegExp.lastIndex - this.match[0].length;
	var managedMacro = settings.getMacros(options)[macroName];
	if (!managedMacro) {
		// We don't manage this macro. Bye.
		return undefined;
	}
	var offset = macroName.length+2;
	offset = $tw.utils.skipWhiteSpace(macroText, offset);
	var params = parseParams(paramString, offset+start);
	var macroInfo = {
		name: macroName,
		start: start,
		end: this.matchRegExp.lastIndex,
		params: params
	};
	var results = this.relinkMacroInvocation(macroInfo, text, this.parser, fromTitle, toTitle, options);
	if (results) {
		return this.macroToString(results, text, this.parser, options);
	} else {
		return undefined;
	}
};

/**Processes the given macro,
 * macro: {name:, params:, start:, end:}
 * each parameters: {name:, end:, value:}
 * Macro invocation returned is the same, but relinked, and may have new keys:
 * parameters: {type: macro, start:, newValue: (quoted replacement value)}
 */
exports.relinkMacroInvocation = function(macro, text, parser, fromTitle, toTitle, options) {
	var managedMacro = settings.getMacros(options)[macro.name];
	var modified = false;
	if (!managedMacro) {
		// We don't manage this macro. Bye.
		return undefined;
	}
	if (macro.params.every(function(p) {
		return p.value.indexOf(fromTitle) < 0;
	})) {
		// We cut early if the fromTitle doesn't even appear
		// anywhere in the title. This is to avoid any headache
		// about finding macro definitions (and any resulting
		// exceptions if there isn't even a title to replace.
		return undefined;
	}
	var outMacro = $tw.utils.extend({}, macro);
	outMacro.params = macro.params.slice();
	for (var managedArg in managedMacro) {
		var index = getParamIndexWithinMacrocall(macro.name, managedArg, macro.params, parser, options);
		if (index < 0) {
			// this arg either was not supplied, or we can't find
			// the definition, so we can't tie it to an anonymous
			// argument. Either way, move on to the next.
			continue;
		}
		var param = macro.params[index];
		var handler = managedMacro[managedArg];
		var extendedOptions = $tw.utils.extend({placeholder: parser}, options);
		var value = handler.relink(param.value, fromTitle, toTitle, extendedOptions);
		if (value === undefined) {
			continue;
		}
		var quote = utils.determineQuote(text, param);
		var quoted = utils.wrapAttributeValue(value, quote, ['', "'", '"', '[[', '"""']);
		var newParam = $tw.utils.extend({}, param);
		if (quoted === undefined) {
			var ph = parser.getPlaceholderFor(value,handler.name);
			newParam.newValue = "<<"+ph+">>";
			newParam.type = "macro";
		} else {
			newParam.start = newParam.end - (newParam.value.length + (quote.length*2));
			newParam.value = value;
			newParam.newValue = quoted;
		}
		outMacro.params[index] = newParam;
		modified = true;
	}
	if (modified) {
		return outMacro;
	}
	return undefined;
};

exports.mustBeAWidget = function(macro) {
	for (var i = 0; i < macro.params.length; i++) {
		if (macro.params[i].type === "macro") {
			return true;
		}
	}
	return false
};

/**Given a macro object ({name:, params:, start: end:}), and the text where
 * it was parsed from, returns a new macro that maintains any syntactic
 * structuring.
 */
exports.macroToString = function(macro, text, parser, options) {
	if (exports.mustBeAWidget(macro)) {
		var names = getParamNames(macro.name, macro.params, parser, options);
		var attrs = [];
		for (var i = 0; i < macro.params.length; i++) {
			var p = macro.params[i];
			var val;
			if (p.newValue) {
				val = p.newValue;
			} else {
				val = utils.wrapAttributeValue(p.value);
			}
			attrs.push(" "+names[i]+"="+val);
		}
		return "<$macrocall $name="+utils.wrapAttributeValue(macro.name)+attrs.join('')+"/>";
	} else {
		var builder = new Rebuilder(text, macro.start);
		for (var i = 0; i < macro.params.length; i++) {
			var param = macro.params[i];
			if (param.newValue) {
				builder.add(param.newValue, param.start, param.end);
			}
		}
		return builder.results(macro.end);
	}
};

function getParamIndexWithinMacrocall(macroName, param, params, parser, options) {
	var index, i;
	for (i = 0; i < params.length; i++) {
		if (params[i].name === param) {
			return i;
		}
	}
	var expectedIndex = indexOfParameterDef(macroName, param, parser, options);
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
				var indexOfOther = indexOfParameterDef(macroName, params[i].name, parser, options);
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
function indexOfParameterDef(macroName, paramName, parser, options) {
	var def = getDefinition(macroName, parser, options);
	var params = def.params || [];
	for (var i = 0; i < params.length; i++) {
		if (params[i].name === paramName) {
			return i;
		}
	}
	return -1;
};

function getParamNames(macroName, params, parser, options) {
	var used = Object.create(null);
	var rtn = new Array(params.length);
	var anonsExist = false;
	var i;
	for (i = 0; i < params.length; i++) {
		var name = params[i].name;
		if (name) {
			rtn[i] = name;
			used[name] = true;
		} else {
			anonsExist = true;
		}
	}
	if (anonsExist) {
		var defParams = getDefinition(macroName, parser, options).params || [];
		var defPtr = 0;
		for (i = 0; i < params.length; i++) {
			if (rtn[i] === undefined) {
				while(defPtr < defParams.length && used[defParams[defPtr].name]) {
					defPtr++;
				}
				if (defPtr >= defParams.length) {
					break;
				}
				rtn[i] = defParams[defPtr].name;
				used[defParams[defPtr].name] = true;
			}
		}
	}
	return rtn;
};

/** Returns undefined if the definition cannot be found.
 */
function getDefinition (macroName, parser, options) {
	var variableContainer = parser.getVariableWidget();
	var def = variableContainer.variables[macroName];
	if (!def) {
		// Check with the macro modules
		if ($tw.utils.hop($tw.macros, macroName)) {
			def = $tw.macros[macroName];
		} else {
			throw new CannotFindMacroDefError(macroName);
		}
	}
	return def;
};

function parseParams(paramString, pos) {
	var params = [],
		reParam = /\s*(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))/mg,
		paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Process this parameter
		var paramInfo = {
			value: paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5] || paramMatch[6]
		};
		if(paramMatch[1]) {
			paramInfo.name = paramMatch[1];
		}
		//paramInfo.start = pos;
		paramInfo.end = reParam.lastIndex + pos;
		params.push(paramInfo);
		// Find the next match
		paramMatch = reParam.exec(paramString);
	}
	return params;
};
