/*\

Manages indirect attribute.

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var refHandler = relinkUtils.getType('reference');

exports.name = 'indirect';

exports.wrap = function(attribute, textReference) {
	return "{{" + textReference + "}}";
};

exports.rawString = function(attribute, options) {
	return attribute.textReference;
};

exports.reassemble = function(attribute, options) {
	return "{{" + attribute.textReference + "}}";
};

exports.compute = function(attribute, context, options) {
	var parentWidget = context.widget;
	return options.wiki.getTextReference(attribute.textReference, "", parentWidget.variables.currentTiddler.value);
};

exports.report = function(element, attribute, valueModules, callback, options) {
	refHandler.report(attribute.textReference, function(title, blurb, style) {
		callback(title, '{{' + (blurb || '') + '}}', style);
	}, options);
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
	var entry = refHandler.relinkInBraces(attribute.textReference, fromTitle, toTitle, options);
	if (entry && entry.output) {
		attribute.textReference = entry.output;
	}
	return entry;
};
