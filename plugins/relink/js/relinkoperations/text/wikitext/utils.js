/*\
module-type: library

Utility methods for the wikitext relink rules.

\*/

/**Finds an appropriate quote mark for a given value.
 *
 *Tiddlywiki doesn't have escape characters for attribute values. Instead,
 * we just have to find the type of quotes that'll work for the given title.
 * There exist titles that simply can't be quoted.
 * If it can stick with the preference, it will.
 *
 * return: Returns the wrapped value, or undefined if it's impossible to wrap
 */
exports.wrapAttributeValue = function(value, preference, whitelist) {
	whitelist = whitelist || ["", "'", '"', '"""'];
	var choices = {
		"": function(v) {return !/([\/\s<>"'=])/.test(v); },
		"'": function(v) {return v.indexOf("'") < 0; },
		'"': function(v) {return v.indexOf('"') < 0; },
		'"""': function(v) {return v.indexOf('"""') < 0 && v[v.length-1] != '"';},
		"[[": exports.canBePrettyOperand
	};
	var wrappers = {
		"": function(v) {return v; },
		"'": function(v) {return "'"+v+"'"; },
		'"': function(v) {return '"'+v+'"'; },
		'"""': function(v) {return '"""'+v+'"""'; },
		"[[": function(v) {return "[["+v+"]]"; }
	};
	if (choices[preference]) {
		if (choices[preference](value)) {
			return wrappers[preference](value);
		}
	}
	for (var i = 0; i < whitelist.length; i++) {
		var quote = whitelist[i];
		if (choices[quote](value)) {
			return wrappers[quote](value);
		}
	}
	// No quotes will work on this
	return undefined;
};

/**Return true if value can be used inside a prettylink.
 */
exports.canBePretty = function(value) {
	return value.indexOf("]]") < 0 && value[value.length-1] !== ']';
};

exports.canBePrettyOperand = function(value) {
	return value.indexOf(']') < 0;
};

/**Given some text, and a param or  attribute within that text, this returns
 * what type of quotation that attribute is using.
 *
 * param: An object in the form {end:, ...}
 */
exports.determineQuote = function(text, param) {
	var pos = param.end-1;
	if (text[pos] === "'") {
		return "'";
	}
	if (text[pos] === '"') {
		if (text.substr(pos-2, 3) === '"""') {
			return '"""';
		} else {
			return '"';
		}
	}
	if (text.substr(pos-1,2) === ']]' && text.substr((pos-param.value.length)-3, 2) === '[[') {
		return "[[";
	}
	return '';
};
