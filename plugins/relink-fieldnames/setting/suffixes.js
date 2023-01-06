/*\

title: $:/plugins/flibbles/relink-fieldnames/setting/suffixes.js
module-type: relinksetting
type: application/javascript

The setting module interfaces with the relink settings to store
the whitelist for all the operator suffixes
\*/

var utils = require('$:/plugins/flibbles/relink/js/utils');

exports.name = "suffixes";

exports.generate = function(suffixes, tiddler, key) {
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
		suffixes[name] = suffixes[name] || Object.create(null);
		suffixes[name][pair[1] || 1] = data;
	}
};
