/*\

This relinks tiddlers which contain a tiddler list as their body.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var listHandler = require("$:/plugins/flibbles/relink/js/utils").getType('list');

exports.type = 'text/x-tiddler-list';

exports.report = listHandler.report;
exports.relink = listHandler.relink;
