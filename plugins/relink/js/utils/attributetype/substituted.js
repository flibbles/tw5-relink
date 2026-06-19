/*\

Manages substituted attribute.

\*/

var substitution = require("$:/plugins/flibbles/relink/js/utils/substitution.js");
var utils = require('$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/utils.js');

exports.name = 'substituted';

exports.wrap = function(rawValue) {
	return "`" + rawValue + "`";
};

exports.rawString = function(attribute, options) {
	return attribute.rawValue;
};

exports.report = function(element, attribute, valueModules, callback, options) {
	substitution.report(attribute.rawValue, function(title, blurb, style) {
		callback(title, '`' + blurb + '`', style);
	}, options);
	for (var operatorName in valueModules) {
		var operator = valueModules[operatorName];
		var handler = operator.getHandler(element, attribute, options);
		if (handler) {
			handler.report(attribute.rawValue, function(title, blurb, style) {
				// Only consider titles without substitutions.
				if (!utils.containsPlaceholders(title)) {
					blurb = (utils.containsPlaceholders(attribute.rawValue) || blurb)? '`' + blurb + '`': '';
					if (operator.formBlurb) {
						blurb = operator.formBlurb(element, attribute, blurb, options);
						style = style || {};
						style.customBlurb = true;
					}
					callback(title, blurb, style);
				}
			}, options);
			break;
		}
	}
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
};
