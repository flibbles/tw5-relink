/*\

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var settings = require('$:/plugins/flibbles/relink/js/settings.js');

exports['fields'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = settings.getFields(options);
	$tw.utils.each(fields, function(relinker, field) {
		var handler = new utils.FieldHandler(tiddler, field);
		var value = relinker(handler, fromTitle, toTitle, options);
		if (value !== undefined) {
			changes[field] = value;
		}
	});
};
