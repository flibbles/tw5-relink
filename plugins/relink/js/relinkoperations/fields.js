/*\

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;

exports['fields'] = function(tiddler, fromTitle, toTitle, logger, changes, options) {
	var fields = settings.getFields(options);
	$tw.utils.each(fields, function(handler, field) {
		var input = tiddler.fields[field];
		var value = handler.relink(input, fromTitle, toTitle, logger, options);
		if (value !== undefined) {
			logger.add({ name: "field", field: field });
			changes[field] = value;
		}
	});
};
