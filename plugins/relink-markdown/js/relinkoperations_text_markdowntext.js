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
var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var wikitextHandler = settings.getType('wikitext');

var markdownRuleClasses;

function parse(tiddler, fromTitle, toTitle, options) {
	var placeholder = new Placeholder();
	if (!markdownRuleClasses) {
		markdownRuleClasses = $tw.modules.createClassesFromModules("relinkmarkdowntextrule", "inline", $tw.WikiRuleBase);
	}
	var extraOptions = $tw.utils.extend(
		{
			currentTiddler: tiddler.fields.title,
			type: "text/x-markdown",
			placeholder: placeholder
		}, options);
	var pragma = options.wiki._relinkMarkdownPragma || '';
	var text = pragma + tiddler.fields.text;
	var entry = wikitextHandler.relink(text, fromTitle, toTitle, extraOptions);
	if (entry && entry.output) {
		// If there's output, we've also got to prepend any macros
		// that the placeholder defined.
		var preamble = placeholder.getPreamble();
		entry.output = preamble + entry.output.slice(pragma.length);
	}
	return entry;
};

parse.setWikitextState = function(wiki) {
	var pragma,
		wikitextTitle = "$:/config/markdown/renderWikiText";
	var value = wiki.getTiddlerText(wikitextTitle);
	if (value === undefined || value.toLowerCase() === "true") {
		pragma = getPragmaFromTiddler(wiki);
	} else {
		pragma = "\\rules only markdownlink\n";
	}
	// I think this is better than making a global variable, which makes
	// testing precarious.
	// Still hate that tiddlywiki/markdown is making me do this.
	wiki._relinkMarkdownPragma = pragma;
};

function getPragmaFromTiddler(wiki) {
	var pragmaTitle = "$:/config/markdown/renderWikiTextPragma";
	var pragma = wiki.getTiddlerText(pragmaTitle);
	if (pragma) {
		pragma = pragma.trim();
		pragma = pragma.replace(/^(\\rules[^\S\n]+only[^\r\n]*)/gm, "$1 markdownlink");
		return pragma + "\n";
	} else {
		return '';
	}
};

// This weird setup is so we can test this method, but also have it only
// calculate once when Tiddlywiki loads, which is the same time the
// tiddlywiki/markdown plugin calculates.
parse.setWikitextState($tw.wiki);

exports["text/x-markdown"] = parse;
