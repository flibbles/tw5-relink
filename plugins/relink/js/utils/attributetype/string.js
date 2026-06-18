/*\

Manages string attribute.

\*/

exports.name = 'string';

exports.wrap = function(value) {
	if (!/([\s>"':])/.test(value) && value.length > 0) {
		return value;
	} else if (value.indexOf('"') < 0) {
		return '"' + value + '"';
	} else if (value.indexOf('\'') < 0) {
		return '\'' + value + '\'';
	} else if (value.indexOf(']]') < 0) {
		return '[[' + value + ']]';
	}
	// I guess just go with the quotes then
	return '"' + value + '"';
};

exports.rawString = function(attribute, options) {
	return attribute.value;
};

exports.report = function(element, attribute, valueModules, callback, options) {
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
};
