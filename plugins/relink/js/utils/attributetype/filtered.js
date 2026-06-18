/*\

Manages filtered attribute.

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var filterHandler = relinkUtils.getType('filter');

exports.name = 'filtered';

exports.wrap = function(filter) {
	return "{{{" + filter + "}}}";
};

exports.rawString = function(attribute, options) {
	return attribute.filter;
};

exports.report = function(element, attribute, valueModules, callback, options) {
	filterHandler.report(attribute.filter, function(title, blurb, style) {
		callback(title, '{{{' + blurb + '}}}', style);
	}, options);
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
	var entry = filterHandler.relinkInBraces(attribute.filter, fromTitle, toTitle, options);
	if (entry && entry.output) {
		attribute.filter = entry.output;
	}
	return entry;
};
