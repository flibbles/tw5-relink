var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');
var stringParameterOperators = $tw.modules.getModulesByTypeAsHashmap('relinkstringparameters');

exports.name = "parameters";

exports.report = function(context, macro, callback, options) {
	var nestedOptions = Object.create(options);
	nestedOptions.settings = context;
	for (var index in macro.params) {
		var param = macro.params[index];
		if (param.assignmentOperator !== '='
		|| param.type === 'string') {
			for (var operatorName in stringParameterOperators) {
				var operator = stringParameterOperators[operatorName];
				if (macro.resolved === undefined) {
					assignNamesToNameless(macro, nestedOptions);
				}
				try {
					var handler = operator.getHandler(macro, param, nestedOptions);
				} catch (e) {
					// We couldn't find the definition
					// Let's not RSoD, just ignore the macro
					continue;
				}
				if (handler) {
					handler.report(param.value, function(title, blurb, style) {
						if (operator.formBlurb) {
							if (blurb) {
								blurb = '"' + blurb + '"';
							}
							callback(title, operator.formBlurb(macro, param, blurb, options), style);
						} else if (blurb) {
							var assignment = param.assignmentOperator || ":";
							callback(title, macro.name + ' ' + param.resolvedName + assignment + ' "' + blurb + '"', style);
						} else {
							callback(title, macro.name + ' ' + param.resolvedName, style);
						}
					}, options);
					break;
				}
			}
		} else {
			var typeHandler = attrTypeOperators[param.type];
			if (typeHandler) {
				typeHandler.report(param, stringParameterOperators, function(title, blurb, style) {
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
		if (param.assignmentOperator !== '='
		|| param.type === 'string') {
			for (var operatorName in stringParameterOperators) {
				var operator = stringParameterOperators[operatorName];
				if (macro.resolved === undefined) {
					assignNamesToNameless(macro, nestedOptions);
				}
				try {
					var handler = operator.getHandler(macro, param, nestedOptions);
				} catch (e) {
					if (e instanceof utils.CannotFindMacroDef) {
						impossible = true;
						continue;
					}
				}
				if (handler) {
					entry = handler.relink(param.value, fromTitle, toTitle, options);
					if (entry) {
						if (entry.output) {
							param.quote = utils.determineQuote(text, param);
							param.oldValue = param.value;
							param.value = entry.output;
							param.handler = handler.name;
							changed = true;
							param.modified = true;
							// Change it into a string if this was a
							// substitution that had no substitutions
							param.type = 'string';
						}
						if (entry.impossible) {
							impossible = true;
						}
					}
				}
			}
		} else {
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

