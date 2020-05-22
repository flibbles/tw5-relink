/*\

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

exports["text/x-markdown"] = function(tiddler, fromTitle, toTitle, options) {
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
	var pragma = getWikiTextPragma(options);
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

function getWikiTextPragma(options) {
	var wikitextTitle = "$:/config/markdown/renderWikiText";
	var pragmaTitle = "$:/config/markdown/renderWikiTextPragma";
	var pragma = options.wiki.getCacheForTiddler(wikitextTitle, "relink-pragma", function() {
		var value = options.wiki.getTiddlerText(wikitextTitle);
		if (value === undefined || value.toLowerCase() === "true") {
			return true;
		} else {
			return "\\rules only markdownlink\n";
		}
	});
	if (pragma === true) {
		return options.wiki.getCacheForTiddler(pragmaTitle, "relink-pragma", function() {
			var pragma = options.wiki.getTiddlerText(pragmaTitle);
			if (pragma) {
				pragma = pragma.trim();
				pragma = pragma.replace(/^(\\rules[^\S\n]+only[^\r\n]*)/gm, "$1 markdownlink");
				return pragma + "\n";
			} else {
				// An empty rules pragma, instead of '', just to keep the cache
				// from constantly regenerating this value
				return '';
			}
		});
	}
	return pragma;
};
