/*\

Checks for fromTitle in text. If found, sees if it's relevant,
and tries to swap it out if it is.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var wikitextHandler = require('$:/plugins/flibbles/relink/js/utils.js').getType('wikitext');

exports.type = 'text/vnd.tiddlywiki';

exports.report = wikitextHandler.report;
exports.relink = wikitextHandler.relink;
