/*\
module-type: library

This is a backup indexer Relink uses if the real one is disabled, or we're
<V5.1.23. It's not nearly as good, but it caches some.

\*/

"use strict";

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var TiddlerContext = utils.getContext('tiddler');

// This is the indexer we use if the current wiki doesn't support indexers.
function BackupIndexer(wiki) {
	this.wiki = wiki;
};

module.exports = BackupIndexer;

BackupIndexer.prototype.lookup = function(title) {
	return getCache(this.wiki).lookup[title];
};

BackupIndexer.prototype.reverseLookup = function(title) {
	var index = getCache(this.wiki);
	if (!index.reverse[title]) {
		var record = Object.create(null);
		for (var other in index.lookup) {
			if (index.lookup[other][title]) {
				record[other] = index.lookup[other][title];
			}
		}
		index.reverse[title] = record;
	}
	return index.reverse[title];
};

function getCache(wiki) {
	// TODO: do I have any potential name conflicts with my use of cache keys?
	return wiki.getGlobalCache('relink', function() {
		var tiddlerList = wiki.getRelinkableTitles();
		var index = Object.create(null);
		var wikiContext = utils.getWikiContext(wiki);
		for (var i = 0; i < tiddlerList.length; i++) {
			var title = tiddlerList[i];
			var tiddler = wiki.getTiddler(title);
			if (tiddler && !tiddler.fields["plugin-type"]) {
				var context = new TiddlerContext(wiki, wikiContext, title);
				index[title] = utils.getTiddlerRelinkReferences(wiki, title, context);
			}
		}
		return {lookup: index, reverse: Object.create(null)};
	});
};