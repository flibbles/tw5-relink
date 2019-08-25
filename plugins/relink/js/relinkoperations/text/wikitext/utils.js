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
exports.wrapAttributeValue = function(value, preference) {
	var choices = {
		"": function(v) {return !/([\/\s<>"'=])/.test(value); },
		"'": function(v) {return v.indexOf("'") < 0; },
		'"': function(v) {return v.indexOf('"') < 0; },
		'"""': function(v) {return v.indexOf('"""') < 0 && v[v.length-1] != '"';}
	};
	if (choices[preference]) {
		if (choices[preference](value)) {
			return preference + value + preference;
		}
	}
	for (var quote in choices) {
		if (choices[quote](value)) {
			return quote + value + quote;
		}
	}
	// No quotes will work on this
	return undefined;
};

