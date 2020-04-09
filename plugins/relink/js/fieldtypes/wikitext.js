/*\
This specifies logic for updating filters to reflect title changes.
\*/

exports.name = "wikitext";

var type = 'text/vnd.tiddlywiki';

var WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")[type];
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder.js");
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

var WikitextEntry = EntryNode.newType("wikitext");

WikitextEntry.prototype.report = function() {
	var output = [];
	$tw.utils.each(this.children, function(child) {
		// All wikitext children should be able to report
		$tw.utils.each(child.report(), function(report) {
			output.push(report);
		});
	});
	return output;
};


function collectRules() {
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
	return rules;
}

function WikiRelinker(text, title, toTitle, options) {
	WikiParser.call(this, null, text, options);
	if (!this.relinkMethodsInjected) {
		var rules = collectRules();
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
	this.title = title;
	this.toTitle = toTitle;
	this.inlineRules = this.inlineRules.concat(this.pragmaRules, this.blockRules);
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
	while (this.widget.children.length > 0) {
		this.widget = this.widget.children[0];
	}
};

WikiRelinker.prototype.getVariableWidget = function() {
	if (!this.widget) {
		this.widget = this.wiki.relinkGlobalMacros();
		var parentWidget = new Widget({}, {parentWidget: this.widget});
		parentWidget.setVariable("currentTiddler", this.title);
		var widget = new Widget({}, {parentWidget: parentWidget});
		this.addWidget(widget);
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
		results.push("\\define "+name+"() "+val+"\n");
	}
	if (results.length > 0) {
		return results.join('');
	} else {
		return undefined;
	}
};

exports.relink = function(wikitext, fromTitle, toTitle, options) {
	// fromTitle doesn't even show up plaintext. No relinking to do.
	if (!wikitext || wikitext.indexOf(fromTitle) < 0) {
		return;
	}
	var builder = new Rebuilder(wikitext),
		parser = new WikiRelinker(wikitext, options.currentTiddler, toTitle, options),
		extendedOptions = $tw.utils.extend({placeholder: parser}, options),
		matchingRule,
		entry = new WikitextEntry();
	while (matchingRule = parser.findNextMatch(parser.relinkRules, parser.pos)) {
		if (matchingRule.rule.relink) {
			var newEntry = matchingRule.rule.relink(wikitext, fromTitle, toTitle, extendedOptions);
			if (newEntry !== undefined) {
				entry.add(newEntry);
				if (newEntry.output) {
					builder.add(newEntry.output, matchingRule.matchIndex, parser.pos);
				}
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
	if (entry.children.length > 0) {
		if (builder.changed()) {
			builder.prepend(parser.getPreamble());
			entry.output = builder.results();
		}
		return entry;
	}
	return undefined;
};
