/*\

This relinks tiddlers which contain markdown. It tries to be agnostic to
whichever markdown plugin you're using.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var wikitext = require('$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext.js')['text/vnd.tiddlywiki'];

var markdownRuleClasses;

exports["text/x-markdown"] = function(tiddler, fromTitle, toTitle, options) {
	if (!markdownRuleClasses) {
		markdownRuleClasses = $tw.modules.createClassesFromModules("relinkmarkdowntextrule", "inline", $tw.WikiRuleBase);
	}
	var extraOptions = $tw.utils.extend(options || {}, {extraRules: markdownRuleClasses});
	return wikitext(tiddler, fromTitle, toTitle, extraOptions);
};
