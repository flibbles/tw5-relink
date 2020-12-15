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

var customFilterTiddler = "$:/config/flibbles/relink-titles/custom";
var filterTag = "$:/tags/flibbles/relink-titles/Filter";
var configPrefix = "$:/config/flibbles/relink-titles/disabled/";
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');
var language = require("$:/plugins/flibbles/relink/js/language.js");


var TitleEntry = EntryNode.newType("title");

TitleEntry.prototype.report = function() {
	return ["title: " + this.output];
};

exports['title'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var cache = getCache(fromTitle, toTitle, options);
	if (!cache.touched[tiddler.fields.title]) {
		var filters = cache.filters;
		var widget = cache.widget;
		for (var i = 0; i < filters.length; i++) {
			var filter = filters[i];
			var output = filter.call(options.wiki, [tiddler.fields.title], widget);
			var result = output[0];
			if (result) {
				var entry = new TitleEntry();
				if ((options.wiki.getTiddler(result) && fromTitle !== toTitle) || cache.touched[result]) {
					// There's already a tiddler there. We won't clobber it.
					entry.impossible = true;
				} else {
					entry.output = result;
				}
				changes.title = entry;
				// Record that we've touched this one, so we only touch it once.
				// Both its prior and latter. Neither should be touched again.
				cache.touched[tiddler.fields.title] = true;
				cache.touched[result] = true;
				break;
			}
		}
	}
};

function getCache(fromTitle, toTitle, options) {
	if (!options.__titlesCache) {
		// we cache the dummy widget, the filters, and the touch list
		// in the options, so we only need to do this all once for
		// for an entire relink operation
		options.__titlesCache = {
			widget: getWidget(fromTitle, toTitle, options),
			filters: getFilters(fromTitle, toTitle, options),
			touched: Object.create(null)
		};
	}
	return options.__titlesCache;
};

function getWidget(fromTitle, toTitle, options) {
	var parentWidget = options.wiki.makeWidget();
	parentWidget.setVariable('fromTiddler', fromTitle);
	parentWidget.setVariable('toTiddler', toTitle);
	return options.wiki.makeWidget(null, {parentWidget: parentWidget});
};

function getFilters(fromTitle, toTitle, options) {
	var subFilters = [];
	$tw.utils.each(options.wiki.getTiddlersWithTag(filterTag), function(title) {
		var filter = getTiddlerFilter(title, "filter", options);
		if (filter) {
			subFilters.push(filter);
		}
	});
	var filter = getTiddlerFilter(customFilterTiddler, "text", options);
	if (filter) {
		subFilters.push(filter);
	}
	return subFilters;
};

function getTiddlerFilter(title, field, options) {
	var configTiddler = options.wiki.getTiddler(configPrefix + title);
	if (configTiddler && configTiddler.fields.text === "disabled") {
		return null;
	}
	return options.wiki.getCacheForTiddler(title, "relinkFilter", function() {
		var tiddler = options.wiki.getTiddler(title);
		if (tiddler && tiddler.fields[field]) {
			return options.wiki.compileFilter(tiddler.fields[field]);
		} else {
			return null;
		}
	});
};
