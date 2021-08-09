/*\

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

exports.name = 'fields';

exports.report = function(tiddler, callback, options) {
	var fields = options.settings.getFields();
	$tw.utils.each(fields, function(handler, field) {
		var input = tiddler.fields[field];
		if (input) {
			if (field === 'list' && tiddler.fields['plugin-type']) {
				// We have a built-in exception here. plugins use their list
				// field differently. There's a whole mechanism for what
				// they actually point to, but let's not bother with that now
				return;
			}
			handler.report(input, function(title, blurb) {
				if (blurb) {
					callback(title, field + ': ' + blurb);
				} else {
					callback(title, field);
				}
			}, options);
		}
	});
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = options.settings.getFields();
	$tw.utils.each(fields, function(handler, field) {
		var input = tiddler.fields[field];
		if (input) {
			if (field === 'list' && tiddler.fields['plugin-type']) {
				// Same deal as above. Skip.
				return;
			}
			var entry = handler.relink(input, fromTitle, toTitle, options);
			if (entry !== undefined) {
				changes[field] = entry;
			}
		}
	});
};
