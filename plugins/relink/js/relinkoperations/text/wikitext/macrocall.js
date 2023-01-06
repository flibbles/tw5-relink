/*\
module-type: relinkwikitextrule

Handles macro calls.

<<myMacro '[[MyFilter]]' 'myTitle'>>

\*/

var utils = require("./utils.js");
var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var macrocall = require('$:/plugins/flibbles/relink/js/utils/macrocall.js');
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = ["macrocallinline", "macrocallblock"];

exports.report = function(text, callback, options) {
	var macroInfo = getInfoFromRule(this);
	this.parser.pos = macroInfo.end;
	this.reportAttribute(this.parser, macroInfo, callback, options);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var macroInfo = getInfoFromRule(this);
	var managedMacro = this.parser.context.getMacro(macroInfo.name);
	this.parser.pos = macroInfo.end;
	if (!managedMacro) {
		// We don't manage this macro. Bye.
		return undefined;
	}
	var mayBeWidget = this.parser.context.allowWidgets();
	var names = getParamNames(this.parser, macroInfo.name, macroInfo.params, options);
	if (names === undefined) {
		// Needed the definition, and couldn't find it. So if a single
		// parameter needs to placeholder, just fail.
		mayBeWidget = false;
	}
	var entry = macrocall.relink(this.parser.context, macroInfo, text, fromTitle, toTitle, mayBeWidget, options);
	if (entry && entry.output) {
		entry.output = macroToString(entry.output, text, names, options);
	}
	return entry;
};

/** Relinks macros that occur as attributes, like <$element attr=<<...>> />
 *  Processes the same, except it can't downgrade into a widget if the title
 *  is complicated.
 * Kept for backward compatibility reasons
 */
exports.relinkAttribute = function(parser, macro, text, fromTitle, toTitle, options) {
	var entry = macrocall.relink(parser.context, macro, text, fromTitle, toTitle, false, options);
	if (entry && entry.output) {
		entry.output = macrocall.reassemble(entry.output, text, options);
	}
	return entry;
};

/** As in, report a macrocall invocation that is an html attribute.
 * Kept for backward compatibility reasons
 */
exports.reportAttribute = function(parser, macro, callback, options) {
	macrocall.report(parser.context, macro, function(title, blurb) {
		callback(title, "<<" + blurb + ">>");
	}, options);
};

function getInfoFromRule(rule) {
	// Get all the details of the match
	var macroInfo = rule.nextCall;
	if (!macroInfo) {
		//  rule.match is used <v5.1.24
		var match = rule.match,
			offset = $tw.utils.skipWhiteSpace(match[0], match[1].length+2);
		macroInfo = {
			name: match[1],
			start: rule.matchRegExp.lastIndex - match[0].length,
			end: rule.matchRegExp.lastIndex,
		};
		macroInfo.params = parseParams(match[2], offset+macroInfo.start);
	}
	return macroInfo;
};

function mustBeAWidget(macro) {
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
function macroToString(macro, text, names, options) {
	if (mustBeAWidget(macro)) {
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
		return macrocall.reassemble(macro, text, options);
	}
};

function getParamNames(parser, macroName, params, options) {
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
		var def = parser.context.getMacroDefinition(macroName);
		if (def === undefined) {
			// If there are anonymous parameters, and we can't
			// find the definition, then we can't hope to create
			// a widget.
			return undefined;
		}
		var defParams = def.params || [];
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

function parseParams(paramString, pos) {
	var params = [],
		reParam = /\s*(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))/mg,
		paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Process this parameter
		var paramInfo = { };
		// We need to find the group match that isn't undefined.
		for (var i = 2; i <= 6; i++) {
			if (paramMatch[i] !== undefined) {
				paramInfo.value = paramMatch[i];
				break;
			}
		}
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
