/*\

Checks for fromTitle in a tiddler's text. If found, sees if it's relevant,
and tries to swap it out if it is.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');

var textOperations = Object.create(null);
$tw.modules.applyMethods('relinktextoperation', textOperations);

exports['text'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var text = tiddler.fields.text,
		isModified = false;
	if (text && text.indexOf(fromTitle) >= 0) {
		for (var operation in textOperations) {
			// If the operation returns undefined, it means no
			// changes were made.
			var newText = textOperations[operation](tiddler, text, fromTitle, toTitle, options);
			if (newText !== undefined) {
				text = newText;
				isModified = true;
			}
		}
	}
	if (isModified) {
		changes.text = text;
	}
};
