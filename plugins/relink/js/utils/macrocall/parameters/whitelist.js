var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports.name = "whitelist";

exports.getHandler = function(macro, parameter, options) {
	var managedMacro = options.settings.getMacro(macro.name);
	if (managedMacro) {
		if (parameter.resolvedName) {
			return managedMacro[parameter.resolvedName];
		} else if (!macro.resolved) {
			// We may have an unresolved macro, and this parameter
			// could potentially tie to it, so we can't be sure
			// we're right.
			for (var name in managedMacro) {
				if (!accountedFor(name, macro)) {
					throw new utils.CannotFindMacroDef();
				}
			}
		}
	}
};

/* This checks if a given parameter name is accounted for among a macro's
 * resolved parameters.
 */
function accountedFor(paramName, macro) {
	// We use macro params here instead of attributes because
	// earlier versions of TW don't have attributes here.
	for (var i = 0; i < macro.params.length; ++i) {
		if (macro.params[i].resolvedName === paramName) {
			return true;
		}
	}
	return false;
};
