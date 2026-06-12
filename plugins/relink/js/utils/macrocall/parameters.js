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
				entry = typeHandler.relink(param, text, fromTitle, toTitle, options);
				if (entry && entry.output) {
					param.modified = true;
					changed = true;
				}
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
