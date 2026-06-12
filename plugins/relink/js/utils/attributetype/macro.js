/*\

Manages filtered attribute.

\*/

// TODO: This may be a problem
var macrocall = require("$:/plugins/flibbles/relink/js/utils/macrocall.js");

exports.name = 'macro';

exports.prefix = '<<';
exports.suffix = '>>';

exports.rawString = function(attribute, options) {
	return attribute.value.name;
};

exports.report = function(attribute, callback, options) {
	var macro = attribute.value;
	macro.name = macro.name || macro.attributes["$variable"].value;
	macro.params = macro.params || macro.orderedAttributes;
	macrocall.report(options.settings, macro, function(title, blurb, style) {
		callback(title, '<<' + blurb + '>>', style);
	}, options);
};

exports.relink = function(attribute, text, fromTitle, toTitle, options) {
	var macro = attribute.value;
	macro.name = macro.name || macro.attributes["$variable"].value;
	macro.params = macro.params || macro.orderedAttributes;
	var entry = macrocall.relink(options.settings, macro, text, fromTitle, toTitle, false, options);
	if (entry && entry.output) {
		attribute.output = macrocall.reassemble(entry, text, options);
		attribute.value = entry.output;
	}
	return entry;
};
