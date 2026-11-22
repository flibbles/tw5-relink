/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var utils = require("./utils.js");

exports.getTiddlerRelinkReferences = function(title, options) {
	var refs = utils.getIndexer(this).lookup(title);
	return refs && blurbs(refs, options && options.hard);
};

exports.getTiddlerRelinkBackreferences = function(title) {
	var refs = utils.getIndexer(this).reverseLookup(title);
	// For now, I don't have the equivalent "hard" option because I'm not
	// sure it has any value. May change this later.
	return blurbs(refs);
};

exports.getRelinkableTitles = function() {
	var toUpdate = "$:/config/flibbles/relink/to-update";
	var wiki = this;
	return this.getCacheForTiddler(toUpdate, "relink-toUpdate", function() {
		var tiddler = wiki.getTiddler(toUpdate);
		if (tiddler) {
			return wiki.compileFilter(tiddler.fields.text);
		} else {
			// Build the index using both normal and shadow tiddlers (so that backlinks will find shadows).
            return function() {
                return wiki.allTitles().concat(wiki.allShadowTitles());
           };
		}
	})();
};

exports.getRelinkOrphans = function(options) {
	return utils.getIndexer(this).orphans(options);
};

function blurbs(refs, hardOnly) {
	var blurbsOnly = Object.create(null);
	for (var title in refs) {
		for (var i = 0; i < refs[title].length; i++) {
			var record = refs[title][i];
			if (!hardOnly || !record.soft) {
				blurbsOnly[title] = blurbsOnly[title] || [];
				blurbsOnly[title].push(record.blurb);
			}
		}
	}
	return blurbsOnly;
};
