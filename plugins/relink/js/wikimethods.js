/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var utils = require("./utils.js");

/** Returns a pair like this,
 *  { title: {field: entry, ... }, ... }
 */
exports.getRelinkReport = function(fromTitle, toTitle, options) {
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

exports.getTiddlerRelinkBackreferences = function(targetTitle, options) {
	var tiddlerList = this.getRelinkableTitles();
	var backRefs = Object.create(null);
	for (var i = 0; i < tiddlerList.length; i++) {
		var title = tiddlerList[i];
		var tiddler = this.getTiddler(title);
		if (tiddler
			&& !tiddler.fields["plugin-type"]
			&& tiddler.fields.type !== "application/javascript") {
			var referenceMap = this.getTiddlerRelinkReferences(title, options);
			if (referenceMap[targetTitle]) {
				backRefs[title] = referenceMap[targetTitle];
			}
		}
	}
	return backRefs;
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
		var indexer = wiki.getIndexer && wiki.getIndexer("RelinkReferencesIndexer");
		if (!indexer) {
			indexer = {
				lookup: function(title) {
					return utils.getTiddlerRelinkReferences(wiki, title);
				},
				rebuild: function() {}
			}
		}
		wiki._relink_indexer = indexer;
	}
	return wiki._relink_indexer;
};
