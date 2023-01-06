/*\

Factory method for creating the operators whitelist cache.

\*/

var utils = require('../utils');

exports.name = "operators";

exports.generate = function(operators, tiddler, key) {
	var data = utils.getType(tiddler.fields.text.trim());
	if (data) {
		data.source = tiddler.fields.title;
		// Secret feature. You can access a config tiddler's
		// fields from inside the fieldtype handler. Cool
		// tricks can be done with this.
		data.fields = tiddler.fields;
		var pair = key.split('/');
		var name = pair[0];
		data.key = key;
		operators[name] = operators[name] || Object.create(null);
		operators[name][pair[1] || 1] = data;
	}
};
