/*\

Manages substituted attribute.

\*/

exports.name = 'substituted';

exports.wrap = function(rawValue) {
	return "`" + rawValue + "`";
};

exports.rawString = function(attribute, options) {
	return attribute.rawValue;
};

exports.report = function(element, attribute, valueModules, callback, options) {
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
};
