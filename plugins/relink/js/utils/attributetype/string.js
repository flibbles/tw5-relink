/*\

Manages string attribute.

\*/

exports.name = 'string';

exports.wrap = function(value) {
	if (!/([\s>"':])/.test(value) && value.length > 0) {
		return value;
	} else if (value.indexOf('"') < 0) {
		return '"' + value + '"';
	} else if (value.indexOf('\'') < 0) {
		return '\'' + value + '\'';
	} else if (value.indexOf(']]') < 0) {
		return '[[' + value + ']]';
	}
	// I guess just go with the quotes then
	return '"' + value + '"';
};

exports.rawString = function(attribute, options) {
	return attribute.value;
};

exports.report = function(element, attribute, valueModules, callback, options) {
	for (var operatorName in valueModules) {
		var operator = valueModules[operatorName];
		var handler = operator.getHandler(element, attribute, options);
		if (handler) {
			handler.report(attribute.value, function(title, blurb, style) {
				if (operator.formBlurb) {
					if (blurb) {
						// TODO: Maybe I want to use the wrap, but it'll involve changing some tests
						blurb = '"' + blurb + '"';
					}
					var customBlurb = operator.formBlurb(element, attribute, blurb, options);
					style = style || {};
					style.customBlurb = true;
					callback(title, customBlurb, style);
				} else if (blurb) {
					callback(title, '"' + blurb + '"', style);
				} else {
					callback(title, blurb, style);
				}
			}, options);
			break;
		}
	}
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
	var changed = false, impossible = false;
	for (var operatorName in valueModules) {
		var operator = valueModules[operatorName];
		var handler = operator.getHandler(element, attribute, options);
		if (handler) {
			var entry = handler.relink(attribute.value, fromTitle, toTitle, options);
			if (entry) {
				if (entry.output) {
					attribute.oldValue = attribute.value;
					attribute.value = entry.output;
					attribute.handler = handler.name;
					// Change it into a string if this was a
					// substitution that had no substitutions
					attribute.type = 'string';
					changed = true;
				}
				if (entry.impossible) {
					impossible = true;
				}
			}
		}
	}
	if (changed) {
		return {output: attribute.value, impossible: impossible};
	}
	if (impossible) {
		return {impossible: true};
	}
};
