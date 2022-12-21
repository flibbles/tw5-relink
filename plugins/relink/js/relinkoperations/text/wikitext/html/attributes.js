/*\

Handles all element attribute values. Most widget relinking happens here.

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var refHandler = relinkUtils.getType('reference');
var filterHandler = relinkUtils.getType('filter');
var macrocall = require("../macrocall.js");
var attributeOperators = relinkUtils.getModulesByTypeAsHashmap('relinkhtmlattributes', 'name');

exports.name = "attributes";

exports.report = function(element, parser, callback, options) {
	for (var attributeName in element.attributes) {
		var attr = element.attributes[attributeName];
		var nextEql = parser.source.indexOf('=', attr.start);
		// This is the rare case of changing tiddler
		// "true" to something else when "true" is
		// implicit, like <$link to /> We ignore those.
		if (nextEql < 0 || nextEql > attr.end) {
			continue;
		}
		var entry;
		if (attr.type === "string") {
			var handler = getHandler(parser.context, element, attributeName);
			if (handler) {
				handler.report(attr.value, function(title, blurb) {
					if (blurb) {
						callback(title, element.tag + ' ' + attributeName + '="' + blurb + '"');
					} else {
						callback(title, element.tag + ' ' + attributeName);
					}
				}, options);
			}
		} else if (attr.type === "indirect") {
			entry = refHandler.report(attr.textReference, function(title, blurb) {
				callback(title, element.tag + ' ' + attributeName + '={{' + (blurb || '') + '}}');
			}, options);
		} else if (attr.type === "filtered") {
			entry = filterHandler.report(attr.filter, function(title, blurb) {
				callback(title, element.tag + ' ' + attributeName + '={{{' + blurb + '}}}');
			}, options);
		} else if (attr.type === "macro") {
			var macro = attr.value;
			entry = macrocall.reportAttribute(parser, macro, function(title, blurb) {
				callback(title, element.tag + ' ' + attributeName + '=' + blurb);
			}, options);
		}
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	var changed = undefined, impossible = undefined;
	for (var attributeName in element.attributes) {
		var attr = element.attributes[attributeName];
		var nextEql = parser.source.indexOf('=', attr.start);
		// This is the rare case of changing tiddler
		// "true" to something else when "true" is
		// implicit, like <$link to /> We ignore those.
		if (nextEql < 0 || nextEql > attr.end) {
			attr.valueless = true;
			continue;
		}
		var entry;
		switch (attr.type) {
		case 'string':
			var handler = getHandler(parser.context, element, attributeName);
			if (handler) {
				entry = handler.relink(attr.value, fromTitle, toTitle, options);
				if (entry && entry.output) {
					attr.value = entry.output;
					attr.handler = handler.name;
					changed = true;
				}
			}
			break;
		case 'indirect':
			entry = refHandler.relinkInBraces(attr.textReference, fromTitle, toTitle, options);
			if (entry && entry.output) {
				attr.textReference = entry.output;
				changed = true;
			}
			break;
		case 'filtered':
			entry = filterHandler.relinkInBraces(attr.filter, fromTitle, toTitle, options);
			if (entry && entry.output) {
				attr.filter = entry.output;
				changed = true;
			}
			break;
		case 'macro':
			var macro = attr.value;
			entry = macrocall.relinkAttribute(parser, macro, parser.source, fromTitle, toTitle, options);
			if (entry && entry.output) {
				attr.output = entry.output;
				attr.value = $tw.utils.parseMacroInvocation(entry.output, 0);
				changed = true;
			}
		}
		if (entry && entry.impossible) {
			impossible = true;
		}
	}
	if (changed || impossible) {
		return {output: changed, impossible: impossible};
	}
};

function getHandler(context, element, attributeName) {
	for (var operator in attributeOperators) {
		var handler = attributeOperators[operator].getHandler(context, element, attributeName);
		if (handler) {
			return handler;
		}
	}
}
