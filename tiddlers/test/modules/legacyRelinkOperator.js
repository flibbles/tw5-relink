/*\
module-type: relinkoperator

Ensure that the old relinkoperator modules will still work, even if they
don't report anymore.

\*/

"use strict";

var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

var FieldEntry = EntryNode.newType("refField");

FieldEntry.prototype.report = function() {
	return [this.field];
};

// Updates all fields that end with .ref or .refs
exports['legacyField'] = function(tiddler, fromTitle, toTitle, changes, options) {
	$tw.utils.each(tiddler.fields, function(value, field) {
		var handler
		if (field.endsWith(".ref")) {
			handler = settings.getType("title");
		} else if (field.endsWith(".refs")) {
			handler = settings.getType("list");
		}
		if (handler) {
			var entry = handler.relink(value, fromTitle, toTitle, options);
			if (entry) {
				var fieldEntry = new FieldEntry();
				// Setting field allows this entry to report properly in //Relink// references tab.
				fieldEntry.field = field;
				// Setting output allows the change to bubble up if this entry is somehow nested.
				fieldEntry.output = entry.output;
				// Needed, in case the relink was impossible. This allows it to report that.
				fieldEntry.add(entry);
				changes[field] = fieldEntry;
			}
		}
	});
};
