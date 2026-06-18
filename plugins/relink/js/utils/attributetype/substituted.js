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

exports.report = function(attribute, thing, callback, options) {
};

exports.relink = function(attribute, text, fromTitle, toTitle, options) {
};
