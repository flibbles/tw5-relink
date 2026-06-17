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
				if (!macro.attributes[name]) {
					throw new utils.CannotFindMacroDef();
				}
			}
		}
	}
};
