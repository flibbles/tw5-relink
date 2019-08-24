/*\

Checks for fromTitle in a tiddler's text. If found, sees if it's relevant,
and tries to swap it out if it is.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var type = 'text/vnd.tiddlywiki';
var WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")[type];

var rules = Object.create(null);
$tw.modules.applyMethods('relinkwikitextrule', rules);

function WikiWalker() {
	WikiParser.apply(this, arguments);
};
WikiWalker.prototype = Object.create(WikiParser.prototype);
WikiWalker.prototype.parseInlineRun = function() {};
WikiWalker.prototype.parseBlocks = function() {};

function State() {
	this.placeholders = Object.create(null);
	this.used = false;
};

State.prototype.getPlaceholderFor = function(value) {
	this.used = true;
	return this.placeholders[value] = "relink-1";
};

State.prototype.getPreamble = function() {
	var rtn = [];
	for (var name in this.placeholders) {
		rtn.push(`\\define ${this.placeholders[name]}() ${name}\n`);
	}
	return rtn;
};

State.prototype.hasPreamble = function() { return this.used; }

exports[type] = function(tiddler, fromTitle, toTitle, changes, options) {
	var text = tiddler.fields.text,
		builder = [],
		buildIndex = 0,
		parser = new WikiWalker(null, text, options),
		state = new State,
		matchingRule;
	while (matchingRule = parser.findNextMatch(parser.inlineRules, parser.pos)) {
		var name = matchingRule.rule.name;
		if (rules[name]) {
			var newSegment = rules[name].call(matchingRule.rule, tiddler, text, fromTitle, toTitle, options, state);
			if (newSegment !== undefined) {
				builder.push(text.substring(buildIndex, matchingRule.matchIndex));
				builder.push(newSegment);
				buildIndex = parser.pos;
			}
		} else {
			if (matchingRule.rule.matchRegExp !== undefined) {
				parser.pos = matchingRule.rule.matchRegExp.lastIndex;
			} else {
				// We can't easily determine the end of this
				// rule match. We'll "parse" it so that
				// parser.pos gets updated, but we throw away
				// the results.
				matchingRule.rule.parse();
			}
		}
	}
	if (builder.length > 0) {
		if (state.hasPreamble()) {
			builder.unshift.apply(builder, state.getPreamble());
		}
		builder.push(text.substr(buildIndex));
		changes.text = builder.join('');
	}
};
