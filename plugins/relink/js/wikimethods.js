/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var utils = require("./utils.js");
var TiddlerContext = utils.getContext('tiddler');

/** Returns a pair like this,
 *  { title: {field: entry, ... }, ... }
 */
exports.getRelinkReport = function(fromTitle, toTitle, options) {
	// TODO: this method's days are numbered
	var cache = this.getGlobalCache("relink-report-"+fromTitle, function() {
		return Object.create(null);
	});
	if (!cache[toTitle]) {
		cache[toTitle] = utils.getRelinkResults(this, fromTitle, toTitle, options);
	}
	return cache[toTitle];
};

exports.getTiddlerRelinkReferences = function(title) {
	return getIndexer(this).lookup(title);
};

exports.getTiddlerRelinkBackreferences = function(title) {
	return getIndexer(this).reverseLookup(title);
};

exports.getRelinkableTitles = function() {
	var toUpdate = "$:/config/flibbles/relink/to-update";
	var self = this;
	return this.getCacheForTiddler(toUpdate, "relink-toUpdate", function() {
		var tiddler = self.getTiddler(toUpdate);
		if (tiddler) {
			return self.compileFilter(tiddler.fields.text);
		} else {
			return self.allTitles;
		}
	})();
};

/** Returns the Relink indexer, or a dummy object which pretends to be one.
 */
function getIndexer(wiki) {
	if (!wiki._relink_indexer) {
		wiki._relink_indexer = (wiki.getIndexer && wiki.getIndexer("RelinkReferencesIndexer")) || new DiscountIndexer(wiki);
	}
	return wiki._relink_indexer;
};

// This is the indexer we use if the current wiki doesn't support indexers.
function DiscountIndexer(wiki) {
	this.wiki = wiki;
};

DiscountIndexer.prototype.lookup = function(title) {
	return getIndex(this.wiki).lookup[title];
};

DiscountIndexer.prototype.reverseLookup = function(title) {
	var index = getIndex(this.wiki);
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

function getIndex(wiki) {
	// TODO: do I have any potential name conflicts with my use of cache keys?
	return wiki.getGlobalCache('relink', function() {
		var tiddlerList = wiki.getRelinkableTitles();
		var index = Object.create(null);
		var wikiContext = utils.getWikiContext(wiki);
		for (var i = 0; i < tiddlerList.length; i++) {
			var title = tiddlerList[i];
			var tiddler = wiki.getTiddler(title);
			if (tiddler
			&& !tiddler.fields["plugin-type"]
			&& tiddler.fields.type !== "application/javascript") {
				var context = new TiddlerContext(wiki, wikiContext, title);
				index[title] = utils.getTiddlerRelinkReferences(wiki, title, context);
			}
		}
		return {lookup: index, reverse: Object.create(null)};
	});
};
