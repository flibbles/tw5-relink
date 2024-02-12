/*\

Methods for reporting and relinking macros. Behaves much like a fieldtype, except that it's not.

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var macrocallOperators = utils.getModulesByTypeAsHashmap('relinkmacrocall', 'name');

/** As in, report a macrocall invocation that is an html attribute.
 * macro: must be a macro object.*/
exports.report = function(context, macro, callback, options) {
	for (var operator in macrocallOperators) {
		macrocallOperators[operator].report(context, macro, callback, options);
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
	var entry;
	for (var operator in macrocallOperators) {
		var results = macrocallOperators[operator].relink(context, macro, text, fromTitle, toTitle, options);
		if (results) {
			entry = entry || {};
			if (results.impossible) {
				entry.impossible = true;
			}
			if (results.output) {
				macro = results.output;
				entry.output = macro;
			}
		}
	}
	return entry;
};

/**Converts the macro object into a string, includes the <<..>>.
 * The text is the old text the macro was formed from. It's used to preserve
 * whitespace.
 */
exports.reassemble = function(entry, text, options) {
	var macro = entry.output;
	var builder = new Rebuilder(text, macro.start);
	var varAttribute = macro.attributes && macro.attributes['$variable'];
	if (varAttribute && varAttribute.value !== macro.name) {
		// The name of the macro changed. Update it.
		builder.add(varAttribute.value, macro.start + 2, macro.start + 2 + macro.name.length);
	}
	for (var i = 0; i < macro.params.length; i++) {
		var param = macro.params[i];
		if (param.modified) {
			var newValue = exports.wrapParameterValue(param.value, param.quote);
			if (newValue === undefined) {
				entry.impossible = true;
			} else {
				builder.add(newValue, param.start, param.end);
			}
		}
	}
	return builder.results(macro.end);
};


/**Like wrapAttribute value, except for macro parameters, not attributes.
 *
 * These are more permissive. Allows brackets,
 * and slashes and '<' in unquoted values.
 */
exports.wrapParameterValue = function(value, preference) {
	var whitelist = ["", "'", '"', '[[', '"""'];
	var choices = {
		"": function(v) {return !/([\s>"':])/.test(v); },
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
