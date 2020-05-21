/*\
This specifies logic for updating filters to reflect title changes.
\*/

exports.name = "wikitext";

var type = 'text/vnd.tiddlywiki';

var WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")[type];
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder.js");
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

function WikiRelinker(text, title, fromTitle, toTitle, options) {
	WikiParser.call(this, "text/vnd.tiddlywiki", text, options);
	this.entry = new WikitextEntry();
	this.builder = new Rebuilder(text);
	this.options = options;
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
	this.fromTitle = fromTitle;
	this.toTitle = toTitle;
	this.inlineRules = this.inlineRules.concat(this.pragmaRules, this.blockRules);
	if (options.extraRules) {
		// Extra rules contains the possible markdown rule
		this.extraRules = this.instantiateRules(options.extraRules,"extra",0);
		this.inlineRules = this.inlineRules.concat(this.extraRules);
	}
	// We work through relinkRules so we can change it later.
	// relinkRules is inlineRules so it gets touched up by amendRules().
	this.relinkRules = this.inlineRules;
};

WikiRelinker.prototype = Object.create(WikiParser.prototype);
WikiRelinker.prototype.parsePragmas = function() {return []; };
WikiRelinker.prototype.parseInlineRun = function() {};
WikiRelinker.prototype.parseBlocks = function() {};

WikiRelinker.prototype.relinkRule = function(ruleInfo) {
	if (ruleInfo.rule.relink) {
		var newEntry = ruleInfo.rule.relink(this.source, this.fromTitle, this.toTitle, this.options);
		if (newEntry !== undefined) {
			this.entry.add(newEntry);
			if (newEntry.output) {
				this.builder.add(newEntry.output, ruleInfo.matchIndex, this.pos);
			}
		}
	} else {
		if (ruleInfo.rule.matchRegExp !== undefined) {
			this.pos = ruleInfo.rule.matchRegExp.lastIndex;
		} else {
			// We can't easily determine the end of this
			// rule match. We'll "parse" it so that
			// parser.pos gets updated, but we throw away
			// the results.
			ruleInfo.rule.parse();
		}
	}
};

exports.relink = function(wikitext, fromTitle, toTitle, options) {
	// fromTitle doesn't even show up plaintext. No relinking to do.
	if (!options.settings.survey(wikitext, fromTitle, options)) {
		return undefined;
	}
	var matchingRule,
		newOptions = $tw.utils.extend({}, options);
	newOptions.settings = options.settings.createChildLibrary(options.currentTiddler);
	var parser = new WikiRelinker(wikitext, options.currentTiddler, fromTitle, toTitle, newOptions);
	while (matchingRule = parser.findNextMatch(parser.relinkRules, parser.pos)) {
		parser.relinkRule(matchingRule);
	}
	if (parser.entry.children.length > 0) {
		parser.entry.output = parser.builder.results();
		return parser.entry;
	}
	return undefined;
};
