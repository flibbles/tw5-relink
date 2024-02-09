/*\
module-type: relinktext
title: $:/plugins/flibbles/relink-markdown/text/x-markdowntext.js
type: application/javascript

same as "text/markdown", but for "text/x-markdown"

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var MarkdownType = require("./markdowntext.js");

for (var member in MarkdownType) {
	exports[member] = MarkdownType[member];
}

exports.type = "text/x-markdown";
