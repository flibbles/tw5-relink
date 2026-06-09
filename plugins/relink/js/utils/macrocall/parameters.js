var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var refHandler = utils.getType('reference');
var filterHandler = utils.getType('filter');

exports.name = "parameters";

exports.report = function(context, macro, callback, options) {
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	for (var index in macro.params) {
		var param = macro.params[index];
		if (param.assignmentOperator === "=") {
			switch (param.type) {
			case 'indirect':
				refHandler.report(param.textReference, function(title, blurb, style) {
					callback(title, macro.name + ' ' + param.name + '={{' + (blurb || '') + '}}', style);
				}, nestedOptions);
				break;
			case 'filtered':
				filterHandler.report(param.filter, function(title, blurb, style) {
					callback(title, macro.name + ' ' + param.name + '={{{' + blurb + '}}}', style);
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
			switch (param.type) {
			case 'indirect':
				entry = refHandler.relinkInBraces(param.textReference, fromTitle, toTitle, nestedOptions);
				if (entry && entry.output) {
					param.textReference = entry.output;
					param.modified = true;
					changed = true;
				}
				break;
			case 'filtered':
				entry = filterHandler.relinkInBraces(param.filter, fromTitle, toTitle, options);
				if (entry && entry.output) {
					param.filter = entry.output;
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
