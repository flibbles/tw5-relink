/*\

Manages indirect attribute.

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var refHandler = relinkUtils.getType('reference');

exports.name = 'indirect';

exports.wrap = function(textReference) {
	return "{{" + textReference + "}}";
};

exports.rawString = function(attribute, options) {
	return attribute.textReference;
};

exports.report = function(attribute, callback, options) {
	refHandler.report(attribute.textReference, function(title, blurb, style) {
		callback(title, '{{' + (blurb || '') + '}}', style);
	}, options);
};

exports.relink = function(attribute, text, fromTitle, toTitle, options) {
	var entry = refHandler.relinkInBraces(attribute.textReference, fromTitle, toTitle, options);
	if (entry && entry.output) {
		attribute.textReference = entry.output;
	}
	return entry;
};
