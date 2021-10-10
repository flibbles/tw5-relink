/*\

This relinks tiddlers which contain a single title as their body.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var titleHandler = require("$:/plugins/flibbles/relink/js/utils").getType('title');

exports.type = 'text/x-tiddler-title';

exports.report = titleHandler.report;
exports.relink = titleHandler.relink;
