/*\

Factory method for creating the fields whitelist cache.

\*/

var utils = require('../utils');

exports.name = "fields";

exports.generate = function(fields, tiddler, name) {
	var data = utils.getType(tiddler.fields.text.trim());
	if (data) {
		data.source = tiddler.fields.title;
		// Secret feature. You can access a config tiddler's
		// fields from inside the fieldtype handler. Cool
		// tricks can be done with this.
		data.fields = tiddler.fields;
		fields[name] = data;
	}
};
