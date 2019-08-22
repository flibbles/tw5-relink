/*\

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var settings = require('$:/plugins/flibbles/relink/js/settings.js');

exports['fields'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = settings.getFields(options);
	$tw.utils.each(fields, function(relinker, field) {
		var handler = new FieldHandler(tiddler, field);
		var value = relinker(handler, fromTitle, toTitle, options);
		if (value !== undefined) {
			changes[field] = value;
		}
	});
};

/**FieldHandler is part of a hack solution I have for managing different
 * kinds of logging while using the same fieldtype handlers. I don't like it.
 * I think I just need to make logging more generic.
 */
function FieldHandler(tiddler, field) {
	this.tiddler = tiddler;
	this.field = field;
};

FieldHandler.prototype.value = function() {
	return this.tiddler.fields[this.field];
};

FieldHandler.prototype.descriptor = function(adjective) {
	if (this.field === "tags") {
		return "tag";
	} else if (adjective) {
		return this.field + " " + adjective;
	} else {
		return this.field;
	}
};

FieldHandler.prototype.log = function(adjective, from, to) {
	console.log(`Renaming ${this.descriptor(adjective)} '${from}' to '${to}' of tiddler '${this.tiddler.fields.title}'`);
};
