/*\
title: $:/plugins/flibbles/relink-fieldnames/relinkprefix.js
module-type: relinkprefix
type: application/javascript

Updates the whitelist entries for fields that are being renamed.

\*/

"use strict";

var utils = require("./utils.js");

exports.prefix = "$:/config/flibbles/relink/fields/";

exports.report = function(tiddler, callback, options) {
	// If this is a whitelist entry, report it.
	var title = tiddler.fields.title.substr(exports.prefix.length);
	callback(title, "#relink " + tiddler.fields.text, {soft: true});
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	// If this is a whitelist entry for the fromTitle field, update it.
	if (tiddler.fields.title.substr(exports.prefix.length) === fromTitle) {
		var newTitle = exports.prefix + toTitle;
		// Make sure we wouldn't be deleting an existing whitelist entry.
		changes.title = (!options.wiki.tiddlerExists(newTitle)) ?
			{ output: newTitle }:
			{ impossible: true };
	}
};
