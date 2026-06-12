/*\

Manages filtered attribute.

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var filterHandler = relinkUtils.getType('filter');

exports.name = 'filtered';
exports.prefix = '{{{';
exports.suffix = '}}}';

exports.rawString = function(attribute, options) {
	return attribute.filter;
};

exports.report = function(attribute, callback, options) {
	filterHandler.report(attribute.filter, function(title, blurb, style) {
		callback(title, '{{{' + blurb + '}}}', style);
	}, options);
};

exports.relink = function(attribute, fromTitle, toTitle, options) {
	var entry = filterHandler.relinkInBraces(attribute.filter, fromTitle, toTitle, options);
	if (entry && entry.output) {
		attribute.filter = entry.output;
	}
	return entry;
};
