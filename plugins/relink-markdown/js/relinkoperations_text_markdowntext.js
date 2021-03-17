/*\
module-type: relinktextoperator
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext.js
type: application/javascript

This relinks tiddlers which contain markdown. It tries to be agnostic to
whichever markdown plugin you're using.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var Placeholder = require("$:/plugins/flibbles/relink/js/utils/placeholder.js");
var markdownHandler = require('$:/plugins/flibbles/relink/js/utils.js').getType('markdown');

exports.type = "text/x-markdown";

exports.report = function(tiddler, callback, options) {
	var currentOptions = Object.create(options);
	// TODO: I think this is unnecessary. currentTiddler is set higher.
	currentOptions.currentTiddler = tiddler.fields.title;
	markdownHandler.report(tiddler.fields.text, callback, currentOptions);
};

exports.relink = function(tiddler, fromTitle, toTitle, options) {
	var placeholder = new Placeholder();
	var extraOptions = $tw.utils.extend(
		{
			currentTiddler: tiddler.fields.title,
			placeholder: placeholder
		}, options);
	var entry = markdownHandler.relink(tiddler.fields.text, fromTitle, toTitle, extraOptions);
	if (entry && entry.output) {
		// If there's output, we've also got to prepend any macros
		// that the placeholder defined.
		var preamble = placeholder.getPreamble();
		entry.output = preamble + entry.output
	}
	return entry;
};
