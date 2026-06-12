var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var refHandler = utils.getType('reference');
var filterHandler = utils.getType('filter');
// TODO: This may be a problem
var macrocall = require("$:/plugins/flibbles/relink/js/utils/macrocall.js");
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');

exports.name = "parameters";

exports.report = function(context, macro, callback, options) {
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	for (var index in macro.params) {
		var param = macro.params[index];
		if (param.assignmentOperator === "=") {
			var typeHandler = attrTypeOperators[param.type];
			if (typeHandler) {
				typeHandler.report(param, function(title, blurb, style) {
					var newBlurb = macro.name + ' ' + param.name + '=' + blurb;
					callback(title, newBlurb, style);
				}, options);
			} else switch (param.type) {
			case 'macro':
				var submacro = param.value;
				submacro.name = submacro.attributes["$variable"].value;
				submacro.params = submacro.orderedAttributes;
				macrocall.report(options.settings, submacro, function(title, blurb, style) {
					callback(title, macro.name + ' ' + param.name + '=<<' + blurb + '>>', style);
				}, options);
				break;
			}
		}
	}
};

exports.relink = function(context, macro, text, fromTitle, toTitle, options) {
	var changed = undefined, impossible = undefined;
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	for (var index in macro.params) {
		var param = macro.params[index];
		if (param.assignmentOperator === '=') {
			var entry;
			var typeHandler = attrTypeOperators[param.type];
			if (typeHandler) {
				entry = typeHandler.relink(param, fromTitle, toTitle, options);
				if (entry && entry.output) {
					param.modified = true;
					changed = true;
				}
			} else switch (param.type) {
			case 'macro':
				var submacro = param.value;
				submacro.name = submacro.attributes["$variable"].value;
				submacro.params = submacro.orderedAttributes;
				entry = macrocall.relink(options.settings, submacro, text, fromTitle, toTitle, false, options);
				if (entry && entry.output) {
					param.output = macrocall.reassemble(entry, text, options);
					param.value = entry.output;
					param.modified = true;
					changed = true;
				}
				break;
			}
			if (entry && entry.impossible) {
				impossible = true;
			}
		}
	}
	if (changed || impossible) {
		return {output: macro, impossible: impossible};
	}
};
