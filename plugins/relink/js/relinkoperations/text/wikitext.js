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
	this.inlineRules = this.inlineRules.concat(this.pragmaRules);
	// We work through relinkRules so we can change it later.
	// relinkRules is inlineRules so it gets touched up by amendRules().
	this.relinkRules = this.inlineRules;
};
WikiWalker.prototype = Object.create(WikiParser.prototype);
WikiWalker.prototype.parsePragmas = function() {return []; };
WikiWalker.prototype.parseInlineRun = function() {};
WikiWalker.prototype.parseBlocks = function() {};

function State() {
	this.placeholder = undefined;
	this.used = false;
	this.reserved = {};
};

State.prototype.getPlaceholderFor = function(value) {
	if (this.placeholder === undefined) {
		this.used = true;
		var number = 1;
		while(this.reserved[number]) {number+=1};
		this.placeholder = "relink-" + number;
		this.value = value;
	}
	return this.placeholder;
};

State.prototype.reserve = function(number) {
	this.reserved[parseInt(number)] = true;
};

State.prototype.getPreamble = function() {
	if (this.placeholder) {
		return `\\define ${this.placeholder}() ${this.value}\n`;
	}
	return undefined;
};

exports[type] = function(tiddler, fromTitle, toTitle, changes, options) {
	var text = tiddler.fields.text,
		builder = [],
		buildIndex = 0,
		parser = new WikiWalker(null, text, options),
		state = new State,
		matchingRule;
	while (matchingRule = parser.findNextMatch(parser.relinkRules, parser.pos)) {
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
		var preamble = state.getPreamble();
		if (preamble) {
			builder.unshift(preamble);
		}
		builder.push(text.substr(buildIndex));
		changes.text = builder.join('');
	}
};
