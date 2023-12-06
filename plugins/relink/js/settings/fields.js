/*\

Factory method for creating the fields whitelist cache.

\*/

var utils = require('../utils');

exports.name = "fields";

exports.generate = function(fields, tiddler, name) {
	var data = utils.getType(tiddler.fields.text.trim());
	if (data) {
		data.source = tiddler.fields.title;
		fields[name] = data;
	}
};
