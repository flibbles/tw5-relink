/*\

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;

exports['fields'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = settings.getFields(options);
	$tw.utils.each(fields, function(handler, field) {
		var input = tiddler.fields[field];
		var value = handler.relink(input, fromTitle, toTitle, options);
		if (value !== undefined) {
			log("field", {
				from: fromTitle,
				to: toTitle,
				tiddler: tiddler.fields.title,
				field: descriptor(field)
			}, options);
			changes[field] = value;
		}
	});
};

function descriptor(field) {
	if (field === "tags") {
		return "tags";
	} else {
		return field + " field" ;
	}
};
