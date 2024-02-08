/*\

Factory method for creating the macros whitelist cache.

\*/

var utils = require('../utils');

exports.name = "macros";

exports.generate = function(macros, tiddler, key) {
	var data = utils.getType(tiddler.fields.text.trim());
	if (data) {
		data.source = tiddler.fields.title;
		// We take the last index, not the first, because macro
		// parameters can't have slashes, but macroNames can.
		var name = dir(key);
		var arg = key.substr(name.length+1);
		macros[name] = macros[name] || Object.create(null);
		macros[name][arg] = data;
	}
};

/* Returns all but the last bit of a path. path/to/tiddler -> path/to
 */
function dir(string) {
	var index = string.lastIndexOf('/');
	if (index >= 0) {
		return string.substr(0, index);
	}
}
