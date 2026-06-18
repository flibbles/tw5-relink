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

exports.report = function(attribute, thing, callback, options) {
};

exports.relink = function(attribute, text, fromTitle, toTitle, options) {
};
