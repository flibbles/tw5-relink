/*\

This relinks tiddlers which contain a tiddler reference as their body.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var refHandler = require("$:/plugins/flibbles/relink/js/utils").getType('reference');

exports.type = 'text/x-tiddler-reference';

exports.report = refHandler.report;
exports.relink = refHandler.relink;
