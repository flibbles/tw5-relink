/*\

Explicitly handles 'list' and 'tags' so as to maintain vanilla behavior.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports['builtin'] = function(tiddler, fromTitle, toTitle, changes, options) {
	function relink(field) {
		var handler = new utils.FieldHandler(tiddler, field);
		var val = utils.relinkList(handler, fromTitle, toTitle);
		if (val !== undefined) {
			changes[field] = val;
		}
	};
	if(!options.dontRenameInTags) {
		relink("tags");
	}
	if(!options.dontRenameInLists) { // Rename lists
		relink("list");
	}
};
