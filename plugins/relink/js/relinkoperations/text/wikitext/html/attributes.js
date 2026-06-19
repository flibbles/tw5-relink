/*\

Handles all element attribute values. Most widget relinking happens here.

\*/

'use strict';

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var utils = require('../utils.js');
var substitution = require("$:/plugins/flibbles/relink/js/utils/substitution.js");
var attributeOperators = relinkUtils.getModulesByTypeAsHashmap('relinkhtmlattributes', 'name');
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');

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
		var typeHandler = attrTypeOperators[attr.type];
		if (typeHandler) {
			typeHandler.report(element, attr, attributeOperators, function(title, blurb, style) {
				var newBlurb;
				if (style && style.customBlurb) {
					newBlurb = blurb;
					style.customBlurb = false;
				} else {
					newBlurb = element.tag + ' ' + attributeName;
					if (blurb) {
						newBlurb += '=' + blurb;
					}
				}
				callback(title, newBlurb, style);
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
		var entry = undefined;
		var typeHandler = attrTypeOperators[attr.type];
		if (typeHandler) {
			entry = typeHandler.relink(element, attr, attributeOperators, parser.source, fromTitle, toTitle, options);
			if (entry && entry.output) {
				changed = true;
			}
			if (entry && entry.impossible) {
				impossible = true;
			}
		}
	}
	if (changed || impossible) {
		return {output: changed, impossible: impossible};
	}
};
