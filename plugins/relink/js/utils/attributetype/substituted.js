/*\

Manages substituted attribute.

\*/

var substitution = require("$:/plugins/flibbles/relink/js/utils/substitution.js");
var utils = require('$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/utils.js');

exports.name = 'substituted';

exports.wrap = function(attribute, rawValue) {
	return "`" + rawValue + "`";
};

exports.rawString = function(attribute, options) {
	return attribute.rawValue;
};

exports.reassemble = function(attribute, options) {
	return attribute.quotedValue;
};

exports.compute = function(attribute, context, options) {
	return options.wiki.getSubstitutedText(attribute.rawValue, context.widget);
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
	var changed = false, impossible = false;
	var subEntry = substitution.relink(attribute.rawValue, fromTitle, toTitle, options);
	if (subEntry) {
		if (subEntry.output) {
			attribute.rawValue = subEntry.output;
			changed = true;
		}
		if (subEntry.impossible) {
			impossible = true;
		}
	}
	if (!utils.containsPlaceholders(fromTitle)) {
		for (var operatorName in valueModules) {
			var operator = valueModules[operatorName];
			var handler = operator.getHandler(element, attribute, options);
			if (handler) {
				var entry = handler.relink(attribute.rawValue, fromTitle, toTitle, options);
				if (entry) {
					if (entry.impossible) {
						impossible = true;
					}
					if (entry.output) {
						if (utils.containsPlaceholders(toTitle)) {
							// If we relinked, but the toTitle can't be in
							// a substitution, then we must fail instead.
							impossible = true;
						} else {
							attribute.rawValue = entry.output;
							attribute.handler = handler.name;
							changed = true;
						}
					}
				}
			}
		}
	}
	if (changed) {
		var wrapped = wrap(attribute.rawValue);
		if (wrapped) {
			attribute.quotedValue = wrapped;
		} else {
			impossible = true;
			changed = false;
		}
	}
	if (changed || impossible) {
		return {output: changed, impossible: impossible};
	}
};

function wrap(value) {
	var ticIndex = value.lastIndexOf("`");
	var quotedValue;
	if (ticIndex < 0) {
		return "`" + value + "`";
	} else if (ticIndex < value.length-1
			&& value.indexOf("```") < 0) {
		return "```" + value + "```";
	}
	return null;
};
