/*\
module-type: relinkpragma
title: $:/plugins/flibbles/relink-variables/relink.js
type: application/javascript

Takes care of relinking the \relink pragma itself.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");

exports.name = 'variables';

exports.report = function(rule, callback, options) {
	var defTiddler = resolveDefiningTiddler(rule, rule.match[1], options);
	varRelinker.reportForTitle(rule.match[1], function(title, blurb, style) {
		callback(title, "\\relink " + rule.match[2].trim(), style);
	}, defTiddler);
};

exports.relink = function(rule, fromTitle, toTitle, options) {
	var defTiddler = resolveDefiningTiddler(rule, rule.match[1], options);
	var entry = varRelinker.relinkForTitle(rule.match[1], fromTitle, toTitle, defTiddler);
	if (entry && entry.output) {
		var signature =rule.match[0];
		var builder = new Rebuilder(signature);
		var startOfName = signature.indexOf(rule.match[1], 7);
		builder.add(entry.output, startOfName, startOfName + rule.match[1].length);
		entry.output = builder.results();
	}
	return entry;
};

function resolveDefiningTiddler(rule, macroName, options) {
	var current = options.settings.widget.getVariable('currentTiddler');
	var def = options.settings.getMacroDefinition(macroName);
	if (def && def.tiddler === current) {
		// The definition for this \relink is in this file, and it's in scope.
		// This is obviously it.
		return current;
	}
	var nextDefRegExp = new RegExp("\\s*\\\\(?:define|procedure|function|widget)\\s+" + $tw.utils.escapeRegExp(macroName) + "\\(", "mg");
	nextDefRegExp.lastIndex = rule.parser.pos;
	var match = nextDefRegExp.exec(rule.parser.source);
	if (match && match.index === rule.parser.pos) {
		// The definition for this pragma comes immediately after this.
		// That's almost certainly the one.
		return current;
	}
	if (def && def.tiddler) {
		// There's a global definition elsewhere.
		// That may be the one.
		return def.tiddler;
	}
	// We can't find the definition. It's probably later in this file.
	return current;
};
