/*\

Checks for fromTitle in a tiddler's text. If found, sees if it's relevant,
and tries to swap it out if it is.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var type = 'text/vnd.tiddlywiki';
var WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")[type];
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder.js");

var rules = Object.create(null);

$tw.modules.forEachModuleOfType("relinkwikitextrule", function(title, exports) {
	var names = exports.name;
	if (typeof names === "string") {
		names = [names];
	}
	for (var i = 0; i < names.length; i++) {
		rules[names[i]] = exports;
	}
});

function WikiRelinker(text, toTitle, options) {
	WikiParser.call(this, null, text, options);
	if (!this.relinkMethodsInjected) {
		$tw.utils.each([this.pragmaRuleClasses, this.blockRuleClasses, this.inlineRuleClasses], function(classList) {
			for (var name in classList) {
				if (rules[name]) {
					delete rules[name].name;
					$tw.utils.extend(classList[name].prototype, rules[name]);
				}
			}
		});
		WikiRelinker.prototype.relinkMethodsInjected = true;
	}
	this.toTitle = toTitle;
	this.inlineRules = this.blockRules.concat(this.pragmaRules, this.inlineRules);
	// We work through relinkRules so we can change it later.
	// relinkRules is inlineRules so it gets touched up by amendRules().
	this.relinkRules = this.inlineRules;
	this.placeholders = Object.create(null);
	this.reverseMap = Object.create(null);
	this.knownMacros = Object.create(null);
	this.widget = undefined;
};

WikiRelinker.prototype = Object.create(WikiParser.prototype);
WikiRelinker.prototype.parsePragmas = function() {return []; };
WikiRelinker.prototype.parseInlineRun = function() {};
WikiRelinker.prototype.parseBlocks = function() {};

WikiRelinker.prototype.getPlaceholderFor = function(value, category) {
	var placeholder = this.reverseMap[value];
	if (placeholder) {
		return placeholder;
	}
	var number = 0;
	var prefix = "relink-"
	if (category && category !== "title") {
		// I don't like "relink-title-1". "relink-1" should be for
		// titles. lists, and filters can have descriptors though.
		prefix += category + "-";
	}
	do {
		number += 1;
		placeholder = prefix + number;
	} while (this.knownMacros[placeholder]);
	this.placeholders[placeholder] = value;
	this.reverseMap[value] = placeholder;
	this.reserve(placeholder);
	return placeholder;
};

WikiRelinker.prototype.addWidget = function(widget) {
	this.widget = widget;
};

WikiRelinker.prototype.getVariableWidget = function() {
	if (!this.widget) {
		this.widget = this.wiki.relinkGlobalMacros();
	}
	while (this.widget.children.length > 0) {
		this.widget = this.widget.children[0];
	}
	return this.widget;
};

WikiRelinker.prototype.reserve = function(macro) {
	this.knownMacros[macro] = true;
};

WikiRelinker.prototype.getPreamble = function() {
	var results = [];
	for (var name in this.placeholders) {
		var val = this.placeholders[name];
		results.push(`\\define ${name}() ${val}\n`);
	}
	if (results.length > 0) {
		return results.join('');
	} else {
		return undefined;
	}
};

exports[type] = function(tiddler, fromTitle, toTitle, changes, options) {
	var text = tiddler.fields.text,
		builder = new Rebuilder(text),
		parser = new WikiRelinker(text, toTitle, options),
		matchingRule;
	while (matchingRule = parser.findNextMatch(parser.relinkRules, parser.pos)) {
		if (matchingRule.rule.relink) {
			var newSegment = matchingRule.rule.relink(tiddler, text, fromTitle, toTitle, options);
			if (newSegment !== undefined) {
				builder.add(newSegment, matchingRule.matchIndex, parser.pos);
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
	if (builder.changed()) {
		builder.prepend(parser.getPreamble());
		changes.text = builder.results();
	}
};
