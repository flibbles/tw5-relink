/*\

Factory method for creating the attributes whitelist cache.

\*/

var utils = require('../utils');

exports.name = "attributes";

exports.generate = function(attributes, tiddler, key) {
	var data = utils.getType(tiddler.fields.text.trim());
	if (data) {
		data.source = tiddler.fields.title;
		var elem = root(key);
		var attr = key.substr(elem.length+1);
		attributes[elem] = attributes[elem] || Object.create(null);
		attributes[elem][attr] = data;
	}
};

/* Returns first bit of a path. path/to/tiddler -> path
 */
function root(string) {
	var index = string.indexOf('/');
	if (index >= 0) {
		return string.substr(0, index);
	}
};

