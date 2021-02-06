/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var MacroSettings = require('$:/plugins/flibbles/relink/js/utils/macroConfig.js');
var Settings = require("$:/plugins/flibbles/relink/js/settings.js");
var utils = require("./utils.js");

/** Returns a pair like this,
 *  { title: {field: entry, ... }, ... }
 */
exports.getRelinkReport = function(fromTitle, toTitle, options) {
	var cache = this.getGlobalCache("relink-"+fromTitle, function() {
		return Object.create(null);
	});
	if (!cache[toTitle]) {
		cache[toTitle] = utils.getRelinkResults(this, fromTitle, toTitle, options);
	}
	return cache[toTitle];
};

exports.getTiddlerRelinkReferences = function(title) {
	var refIndexer = this.getIndexer("RelinkReferencesIndexer"),
		references = refIndexer && refIndexer.lookup(title);
	if (!references) {
		references = utils.getTiddlerRelinkReferences(this, title);
	}
	return references;
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

exports.getRelinkConfig = function() {
	if (this._relinkConfig === undefined) {
		var settings = new Settings(this);
		var config = new MacroSettings(this, settings);
		config.import( "[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]");
		// All this below is just wiki.addEventListener, only it
		// puts the event in front, because we need to refresh our
		// relink settings before updating tiddlers.
		this.eventListeners = this.eventListeners || {};
		this.eventListeners.change = this.eventListeners.change || [];
		this.eventListeners.change.unshift(function(changes) {
			config.refresh(changes);
		});
		this._relinkConfig = config;
	}
	return this._relinkConfig;
};
