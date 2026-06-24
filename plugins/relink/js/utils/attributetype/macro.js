/*\

Manages filtered attribute.

\*/

// TODO: This may be a problem
var macrocall = require("$:/plugins/flibbles/relink/js/utils/macrocall.js");

exports.name = 'macro';

exports.wrap = function(attribute, macroString) {
	if (attribute.isMVV) {
		return "((" + macroString + "))";
	} else {
		return "<<" + macroString + ">>";
	}
};

exports.rawString = function(attribute, options) {
	return attribute.value.name;
};

exports.reassemble = function(attribute, options) {
	return attribute.output;
};

exports.compute = function(attribute, context, options) {
	var parentWidget = context.widget;
	var params = makeSuitableParams(parentWidget, attribute.value);
	return parentWidget.getVariable(attribute.value.name,{params: params});
};

exports.report = function(element, attribute, valueModules, callback, options) {
	var macro = attribute.value;
	macro.name = macro.name || macro.attributes["$variable"].value;
	macro.params = macro.params || macro.orderedAttributes;
	macrocall.report(options.settings, macro, function(title, blurb, style) {
		if (attribute.isMVV) {
			callback(title, '((' + blurb + '))', style);
		} else {
			callback(title, '<<' + blurb + '>>', style);
		}
	}, options);
};

exports.relink = function(element, attribute, valueModules, text, fromTitle, toTitle, options) {
	var macro = attribute.value;
	macro.name = macro.name || macro.attributes["$variable"].value;
	macro.params = macro.params || macro.orderedAttributes;
	var entry = macrocall.relink(options.settings, macro, text, fromTitle, toTitle, options);
	if (entry && entry.output) {
		attribute.output = macrocall.reassemble(entry, text, options);
		if (!attribute.output) {
			// Nope. Nothing got changed after all.
			entry.output = undefined;
		} else {
			attribute.value = entry.output;
		}
	}
	return entry;
};

function makeSuitableParams(widget, macro) {
	if (macro.params) {
		var params = [];
		for (var i = 0; i < macro.params.length; i++) {
			var attr = macro.params[i];
			var param = {
				value: widget.computeAttribute(attr)
			};
			if (attr.name && !attr.isPositional) {
				param.name = attr.name;
			}
			params.push(param);
		}
		return params;
	}
	return macro.params;
};
