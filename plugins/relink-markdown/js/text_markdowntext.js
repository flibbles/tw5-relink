/*\
module-type: relinktext
title: $:/plugins/flibbles/relink-markdown/text/markdowntext.js
type: application/javascript

This relinks tiddlers which contain markdown. It tries to be agnostic to
whichever markdown plugin you're using.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var markdownHandler = require('$:/plugins/flibbles/relink/js/utils.js').getType('markdown');

exports.type = "text/markdown";

exports.report = markdownHandler.report;
exports.relink = markdownHandler.relink;
