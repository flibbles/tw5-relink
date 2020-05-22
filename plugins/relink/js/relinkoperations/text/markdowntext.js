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
	var pragma = options.wiki.getTiddlerText("$:/config/markdown/renderWikiTextPragma");
	if (pragma) {
		return pragma.trim() + " markdownlink\n";
	} else {
		return '';
	}
};
