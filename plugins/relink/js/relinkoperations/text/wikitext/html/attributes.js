/*\

Handles all element attribute values. Most widget relinking happens here.

\*/

'use strict';

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var utils = require('../utils.js');
var refHandler = relinkUtils.getType('reference');
var filterHandler = relinkUtils.getType('filter');
var macrocall = require("$:/plugins/flibbles/relink/js/utils/macrocall.js");
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
		switch (attr.type) {
		case "string":
			for (var operatorName in attributeOperators) {
				var operator = attributeOperators[operatorName];
				var handler = operator.getHandler(element, attr, options);
				if (handler) {
					handler.report(attr.value, function(title, blurb) {
						if (operator.formBlurb) {
							if (blurb) {
								blurb = '"' + blurb + '"';
							}
							callback(title, operator.formBlurb(element, attr, blurb, options));
						} else if (blurb) {
							callback(title, element.tag + ' ' + attributeName + '="' + blurb + '"');
						} else {
							callback(title, element.tag + ' ' + attributeName);
						}
					}, options);
					break;
				}
			}
			break;
		case "indirect":
			refHandler.report(attr.textReference, function(title, blurb) {
				callback(title, element.tag + ' ' + attributeName + '={{' + (blurb || '') + '}}');
			}, options);
			break;
		case "filtered":
			filterHandler.report(attr.filter, function(title, blurb) {
				callback(title, element.tag + ' ' + attributeName + '={{{' + blurb + '}}}');
			}, options);
			break;
		case "macro":
			var macro = attr.value;
			macrocall.report(options.settings, macro, function(title, blurb) {
				callback(title, element.tag + ' ' + attributeName + '=<<' + blurb + '>>');
			}, options);
			break;
		case "substituted":
			var filterRegex = /\$\{([\S\s]+?)\}\$/g, filter;
			while (filter = filterRegex.exec(attr.rawValue)) {
				filterHandler.report(filter[1], function(title, blurb) {
					callback(title, element.tag + ' ' + attributeName + '=`${' + blurb + '}$`');
				}, options);
			}
			for (var operatorName in attributeOperators) {
				var operator = attributeOperators[operatorName];
				var handler = operator.getHandler(element, attr, options);
				if (handler) {
					handler.report(attr.rawValue, function(title, blurb) {
						// Only consider titles without substitutions.
						if (!utils.containsPlaceholders(title)) {
							blurb = (utils.containsPlaceholders(attr.rawValue) || blurb)? '`' + blurb + '`': '';
							if (operator.formBlurb) {
								callback(title, operator.formBlurb(element, attr, blurb, options));
							} else {
								if (blurb) {
									blurb = '=' + blurb;
								}
								callback(title, element.tag + ' ' + attributeName + blurb);
							}
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
		switch (attr.type) {
		case 'substituted':
			if (utils.containsPlaceholders(attr.rawValue)) {
				var newValue = attr.rawValue.replace(/\$\{([\S\s]+?)\}\$/g, function(match, filter) {
					var filterEntry = filterHandler.relink(filter, fromTitle, toTitle, options);
					if (filterEntry) {
						if (filterEntry.output) {
							// The only }$ should be the one at the very end
							if (filterEntry.output.indexOf("}$") < 0) {
								changed = true;
								return '${' + filterEntry.output + '}$';
							} else {
								impossible = true;
							}
						}
						if (filterEntry.impossible) {
							impossible = true;
						}
					}
					return match;
				});
				attr.rawValue = newValue;
				if (!utils.containsPlaceholders(fromTitle)) {
					for (var operatorName in attributeOperators) {
						var operator = attributeOperators[operatorName];
						var handler = operator.getHandler(element, attr, options);
						if (handler) {
							entry = handler.relink(attr.rawValue, fromTitle, toTitle, options);
							if (entry && entry.output) {
								if (utils.containsPlaceholders(toTitle)) {
									// If we relinked, but the toTitle can't be in
									// a substition, then we must fail instead.
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
			attr.type = 'string';
		case 'string':
			for (var operatorName in attributeOperators) {
				var operator = attributeOperators[operatorName];
				var handler = operator.getHandler(element, attr, options);
				if (handler) {
					entry = handler.relink(attr.value, fromTitle, toTitle, options);
					if (entry && entry.output) {
						attr.value = entry.output;
						attr.handler = handler.name;
						changed = true;
					}
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
			entry = macrocall.relink(options.settings, macro, parser.source, fromTitle, toTitle, false, options);
			if (entry && entry.output) {
				attr.output = macrocall.reassemble(entry, parser.source, options);
				attr.value = entry.output;
				changed = true;
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
