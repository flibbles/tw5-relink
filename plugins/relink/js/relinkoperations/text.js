/*\

Checks for fromTitle in a tiddler's text. If found, sees if it's relevant,
and tries to swap it out if it is.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var wikiparser = require("$:/core/modules/parsers/wikiparser/wikiparser.js");
var WikiParser = wikiparser["text/vnd.tiddlywiki"];

var rules = Object.create(null);
$tw.modules.applyMethods('relinkwikitextrule', rules);

function WikiWalker() {
	WikiParser.apply(this, arguments);
};
WikiWalker.prototype = Object.create(WikiParser.prototype);
WikiWalker.prototype.parseInlineRun = function() {};
WikiWalker.prototype.parseBlocks = function() {};

exports['wikitext'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var text = tiddler.fields.text,
		builder = [],
		buildIndex = 0;
	if (text && text.indexOf(fromTitle) >= 0) {
		var parser = new WikiWalker(null, text, options),
			matchingRule;
		while (matchingRule = parser.findNextMatch(parser.inlineRules, parser.pos)) {
			var name = matchingRule.rule.name;
			console.log("PATTERN NAME:", name);
			if (rules[name]) {
				var newSegment = rules[name].call(matchingRule.rule, tiddler, text, fromTitle, toTitle, parser, matchingRule.matchIndex, options);
				if (newSegment !== undefined) {
					builder.push(text.substring(buildIndex, matchingRule.matchIndex));
					builder.push(newSegment);
					buildIndex = parser.pos;
				}
			} else {
				parser.pos = matchingRule.rule.matchRegExp.lastIndex;
			}
		}
	}
	if (builder.length > 0) {
		builder.push(text.substr(buildIndex));
		changes.text = builder.join('');
	}
};
