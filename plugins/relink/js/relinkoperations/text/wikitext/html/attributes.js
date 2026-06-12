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
			typeHandler.report(attr, function(title, blurb, style) {
				var newBlurb = element.tag + ' ' + attributeName + '=' + blurb;
				callback(title, newBlurb, style);
			}, options);
		} else switch (attr.type) {
		case "string":
			for (var operatorName in attributeOperators) {
				var operator = attributeOperators[operatorName];
				var handler = operator.getHandler(element, attr, options);
				if (handler) {
					handler.report(attr.value, function(title, blurb, style) {
						if (operator.formBlurb) {
							if (blurb) {
								blurb = '"' + blurb + '"';
							}
							callback(title, operator.formBlurb(element, attr, blurb, options), style);
						} else if (blurb) {
							callback(title, element.tag + ' ' + attributeName + '="' + blurb + '"', style);
						} else {
							callback(title, element.tag + ' ' + attributeName, style);
						}
					}, options);
					break;
				}
			}
			break;
		case "substituted":
			substitution.report(attr.rawValue, function(title, blurb, style) {
				callback(title, element.tag + ' ' + attributeName + '=`' + blurb + '`', style);
			}, options);
			for (var operatorName in attributeOperators) {
				var operator = attributeOperators[operatorName];
				var handler = operator.getHandler(element, attr, options);
				if (handler) {
					handler.report(attr.rawValue, function(title, blurb, style) {
						// Only consider titles without substitutions.
						if (!utils.containsPlaceholders(title)) {
							blurb = (utils.containsPlaceholders(attr.rawValue) || blurb)? '`' + blurb + '`': '';
							if (operator.formBlurb) {
								blurb = operator.formBlurb(element, attr, blurb, options);
							} else {
								if (blurb) {
									blurb = '=' + blurb;
								}
								blurb = element.tag + ' ' + attributeName + blurb;
							}
							callback(title, blurb, style);
						}
					}, options);
					break;
				}
			}
			break;
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
			entry = typeHandler.relink(attr, parser.source, fromTitle, toTitle, options);
			if (entry && entry.output) {
				changed = true;
			}
		} else switch (attr.type) {
		case 'substituted':
			if (utils.containsPlaceholders(attr.rawValue)) {
				var subEntry = substitution.relink(attr.rawValue, fromTitle, toTitle, options);
				if (subEntry) {
					if (subEntry.output) {
						attr.rawValue = subEntry.output;
						changed = true;
					}
					if (subEntry.impossible) {
						impossible = true;
					}
				}
				if (!utils.containsPlaceholders(fromTitle)) {
					for (var operatorName in attributeOperators) {
						var operator = attributeOperators[operatorName];
						var handler = operator.getHandler(element, attr, options);
						if (handler) {
							entry = handler.relink(attr.rawValue, fromTitle, toTitle, options);
							if (entry && entry.output) {
								if (utils.containsPlaceholders(toTitle)) {
									// If we relinked, but the toTitle can't be in
									// a substitution, then we must fail instead.
									entry.impossible = true;
								} else {
									attr.rawValue = entry.output;
									attr.handler = handler.name;
									changed = true;
								}
							}
						}
					}
				}
				break;
			}
			// no break. turn it into a string and try to work with it
			attr.value = attr.rawValue;
		case 'string':
			for (var operatorName in attributeOperators) {
				var operator = attributeOperators[operatorName];
				var handler = operator.getHandler(element, attr, options);
				if (handler) {
					entry = handler.relink(attr.value, fromTitle, toTitle, options);
					if (entry && entry.output) {
						attr.oldValue = attr.value;
						attr.value = entry.output;
						attr.handler = handler.name;
						changed = true;
						// Change it into a string if this was a substitution that had no substitutions
						attr.type = 'string';
					}
				}
			}
			break;
		}
		if (entry && entry.impossible) {
			impossible = true;
		}
	}
	if (changed || impossible) {
		return {output: changed, impossible: impossible};
	}
};
