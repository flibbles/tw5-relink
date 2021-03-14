/*\
module-type: relinkoperator
title: $:/plugins/flibbles/relink-titles/relinkoperations/title.js
type: application/javascript

Renames tiddlers which have titles derived from fromTitle. Then it makes
sure that those tiddlers are properly relinked too.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var configPrefix = "$:/config/flibbles/relink-titles/disabled/";
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

var titleRules = $tw.modules.getModulesByTypeAsHashmap('relinktitlesrule');

var TitleEntry = EntryNode.newType("title");

TitleEntry.prototype.report = function() {
	return ["title: " + this.title];
};

exports.name = 'title';

exports.report = function(tiddler, callback, options) {
	var cache = getCache(options),
		rules = cache.rules;
	for (var i = 0; i < rules.length; i++) {
		rules[i].report(tiddler.fields.title, function(title, blurb) {
			callback(blurb ? ('title: ' + blurb) : 'title', title);
		}, options);
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var cache = getCache(options),
		title = tiddler.fields.title;
	if (!cache.touched[title]) {
		var rules = cache.rules;
		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];
			var result = rule.relink(title, fromTitle, toTitle, options);
			if (result && (result !== title)) {
				var entry = new TitleEntry();
				entry.title = title;
				if (options.wiki.getTiddler(result) || cache.touched[result]) {
					// There's already a tiddler there. We won't clobber it.
					entry.impossible = true;
				} else {
					entry.output = result;
				}
				changes.title = entry;
				// Record that we've touched this one, so we only touch it once.
				// Both its prior and latter. Neither should be touched again.
				cache.touched[title] = true;
				cache.touched[result] = true;
				break;
			}
		}
	}
};

function getCache(options) {
	if (!options.__titlesCache) {
		// we cache the dummy widget, the filters, and the touch list
		// in the options, so we only need to do this all once for
		// for an entire relink operation
		options.__titlesCache = {
			rules: getRules(options),
			touched: Object.create(null)
		};
	}
	return options.__titlesCache;
};

function getRules(options) {
	var activeRules = [];
	for (var rule in titleRules) {
		var configTiddler = options.wiki.getTiddler(configPrefix + rule);
		if (!configTiddler || configTiddler.fields.text !== "disabled") {
			activeRules.push(titleRules[rule]);
		}
	}
	return activeRules;
};
