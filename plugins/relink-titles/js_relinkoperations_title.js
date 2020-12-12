/*\
module-type: relinkoperator
title: $:/plugins/flibbles/relink/js/relinkoperations/title.js
type: application/javascript

Renames tiddlers which have titles derived from fromTitle. Then it makes
sure that those tiddlers are properly relinked too.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var prefix = "$:/prefix/";
var configTiddler = "$:/config/flibbles/relink/titles/filter"; 

var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

var TitleEntry = EntryNode.newType("ghost");

TitleEntry.prototype.report = function() {
	return ["title: " + this.output];
};

exports['title'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var filter = getFilter(options.wiki);
	var widget = getWidget(fromTitle, toTitle, options);
	var outTitle = filter.call(options.wiki, [tiddler.fields.title], widget);
	if (outTitle[0]) {
		var entry = new TitleEntry();
		entry.output = outTitle[0];
		changes.title = entry;
	}
};

function getWidget(fromTitle, toTitle, options) {
	// we cache the dummy widget in options, so we only need one for an entire
	// relink operation
	if (!options.__titlesWidget) {
		var parentWidget = options.wiki.makeWidget();
		parentWidget.setVariable('fromTiddler', fromTitle);
		parentWidget.setVariable('toTiddler', toTitle);
		options.__titlesWidget = options.wiki.makeWidget(null, {parentWidget: parentWidget});
	}
	return options.__titlesWidget;
};

function getFilter(wiki) {
	return wiki.getCacheForTiddler(configTiddler, "relinkFilter", function() {
		var tiddler = wiki.getTiddler(configTiddler);
		if (tiddler && tiddler.fields.text) {
			return wiki.compileFilter(tiddler.fields.text);
		} else {
			return function() { return []; };
		}
	});
};
