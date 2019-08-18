/*\

Explicitly handles 'list' and 'tags' so as to maintain vanilla behavior.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports['builtin'] = function(tiddler, fromTitle, toTitle, changes, options) {
	if(!options.dontRenameInTags) {
		utils.relinkList(tiddler, "tags", fromTitle, toTitle, changes);
	}
	if(!options.dontRenameInLists) { // Rename lists
		utils.relinkList(tiddler, "list", fromTitle, toTitle, changes);
	}
};
