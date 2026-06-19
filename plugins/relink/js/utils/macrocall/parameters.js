var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');
var stringParameterOperators = $tw.modules.getModulesByTypeAsHashmap('relinkstringparameters');

exports.name = "parameters";

exports.report = function(context, macro, callback, options) {
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	if (macro.resolved === undefined) {
		assignNamesToNameless(macro, nestedOptions);
	}
	for (var index in macro.params) {
		var param = macro.params[index];
		var typeHandler = attrTypeOperators[param.type] || attrTypeOperators.string;
		if (typeHandler) {
			try {
				typeHandler.report(macro, param, stringParameterOperators, function(title, blurb, style) {
					var newBlurb = macro.name + ' ' + param.resolvedName;
					if (blurb) {
						var assign = param.assignmentOperator === '='? '=': ': ';
						newBlurb += assign + blurb;
					}
					callback(title, newBlurb, style);
				}, nestedOptions);
			} catch (e) {
				// Let's not RSoD, just ignore the parameter
			}
		}
	}
};

exports.relink = function(context, macro, text, fromTitle, toTitle, options) {
	var changed = undefined, impossible = undefined;
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	if (macro.resolved === undefined) {
		assignNamesToNameless(macro, nestedOptions);
	}
	for (var index in macro.params) {
		var param = macro.params[index];
		var entry;
		var typeHandler = attrTypeOperators[param.type] || attrTypeOperators.string;
		if (typeHandler) {
			try {
				entry = typeHandler.relink(macro, param, stringParameterOperators, text, fromTitle, toTitle, options);
				if (entry && entry.output) {
					changed = true;
					param.modified = true;
				}
				if (entry && entry.impossible) {
					impossible = true;
				}
			} catch (e) {
				if (e instanceof utils.CannotFindMacroDef) {
					impossible = true;
				} else {
					throw e;
				}
			}
		}
	}
	if (changed || impossible) {
		return {output: macro, impossible: impossible};
	}
};

function assignNamesToNameless(macro, options) {
	var i,
		anonsExist = false,
		params = macro.params,
		assignedParams = {};
	for (i = 0; i < params.length; i++) {
		var name = params[i].name;
		if (name === undefined || params[i].isPositional) {
			anonsExist = true;
		} else if (name) {
			params[i].resolvedName = name;
			assignedParams[name] = true;
		}
	}
	macro.resolved = true;
	if (anonsExist) {
		var macroDef = options.settings.getMacroDefinition(macro.name);
		if (macroDef !== undefined) {
			var paramDefs = macroDef.params || [];
			var index = 0;
			while (macro.params[index].resolvedName) {
				// Find that first anonymous parameter
				++index;
			}
			var length = macro.params.length;
			for (i = 0; i < paramDefs.length && index < length; i++) {
				var paramDef = paramDefs[i];
				if (!assignedParams[paramDef.name]) {
					// This def hasn't been assigned yet, find next anon param
					macro.params[index].resolvedName = paramDef.name;
					// Find next anyonymous parameter
					do {
						++index;
					} while (index < length
						&& macro.params[index].resolvedName);
				}
			}
		} else {
			macro.resolved = false;
		}
	}
};
