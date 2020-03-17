/*\

This relinks tiddlers which contain filters in their body, as oppose to
wikitext.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');

exports['text/x-tiddler-filter'] = function(tiddler, fromTitle, toTitle, logger, changes, options) {
	// fromTitle doesn't even show up plaintext. No relinking to do.
	if (tiddler.fields.text.indexOf(fromTitle) < 0) {
		return;
	}
	var relinkedFilter = filterHandler.relink(tiddler.fields.text, fromTitle, toTitle, options)
	if (relinkedFilter !== undefined) {
		changes.text = relinkedFilter;
	}
};
