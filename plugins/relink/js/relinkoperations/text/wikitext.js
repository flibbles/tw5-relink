/*\

Checks for fromTitle in a tiddler's text. If found, sees if it's relevant,
and tries to swap it out if it is.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var type = 'text/vnd.tiddlywiki';
var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var wikitextHandler = settings.getRelinker('wikitext');

exports[type] = function(tiddler, fromTitle, toTitle, options) {
	var currentOptions = $tw.utils.extend({currentTiddler: tiddler.fields.title}, options);
	return wikitextHandler.relink(tiddler.fields.text, fromTitle, toTitle, currentOptions);
}
