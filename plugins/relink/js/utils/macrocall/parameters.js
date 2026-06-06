var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var refHandler = utils.getType('reference');

exports.name = "parameters";

exports.report = function(context, macro, callback, options) {
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	for (var index in macro.params) {
		var param = macro.params[index];
		if (param.assignmentOperator === '=' && param.type === 'indirect') {
			refHandler.report(param.textReference, function(title, blurb, style) {
				callback(title, macro.name + ' ' + param.name + '={{' + (blurb || '') + '}}', style);
			}, nestedOptions);
		}
	}
};

exports.relink = function(context, macro, text, fromTitle, toTitle, options) {
	var changed = undefined, impossible = undefined;
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	for (var index in macro.params) {
		var param = macro.params[index];
		if (param.assignmentOperator === '=' && param.type === 'indirect') {
			var entry = refHandler.relinkInBraces(param.textReference, fromTitle, toTitle, nestedOptions);
			if (entry && entry.output) {
				param.textReference = entry.output;
				param.modified = true;
				changed = true;
			}
		}
	}
	if (changed || impossible) {
		return {output: macro, impossible: impossible};
	}
};
