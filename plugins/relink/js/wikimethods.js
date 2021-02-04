/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var MacroSettings = require('$:/plugins/flibbles/relink/js/utils/macroConfig.js');
var Settings = require("$:/plugins/flibbles/relink/js/settings.js");

var relinkOperators = Object.create(null);
$tw.modules.forEachModuleOfType('relinkoperator', function(title, module) {
	if (module.name !== undefined) {
		relinkOperators[module.name] = module;
	} else {
		// TODO: Maybe put some kind of warning message here that
		// this module needs to be updated?
		// Legacy support. It has a relinker, but not a reporter
		for (var entry in module) {
			relinkOperators[entry] = {
				relink: module[entry],
				report: function() {}};
		}
	}
});

/** Returns a pair like this,
 *  { title: {field: entry, ... }, ... }
 */
exports.getRelinkReport = function(fromTitle, toTitle, options) {
	var cache = this.getGlobalCache("relink-"+fromTitle, function() {
		return Object.create(null);
	});
	if (!cache[toTitle]) {
		cache[toTitle] = getFreshRelinkReport(this, fromTitle, toTitle, options);
	}
	return cache[toTitle];
};

exports.getTiddlerRelinkReferences = function(title, options) {
	var tiddler = this.getTiddler(title),
		references = Object.create(null),
	options = options || {};
	options.settings = this.getRelinkConfig();
	if (tiddler) {
		for (var relinker in relinkOperators) {
			relinkOperators[relinker].report(tiddler, function(blurb, title) {
				references[title] = references[title] || [];
				references[title].push(blurb);
			}, options);
		}
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

function getFreshRelinkReport(wiki, fromTitle, toTitle, options) {
	options = options || {};
	options.wiki = options.wiki || wiki;
	options.settings = wiki.getRelinkConfig();
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	var changeList = Object.create(null);
	if(fromTitle && toTitle) {
		var tiddlerList = wiki.getRelinkableTitles();
		for (var i = 0; i < tiddlerList.length; i++) {
			var title = tiddlerList[i];
			var tiddler = wiki.getTiddler(title);
			// Don't touch plugins or JavaScript modules
			if(tiddler
			&& !tiddler.fields["plugin-type"]
			&& tiddler.fields.type !== "application/javascript") {
				try {
					var entries = Object.create(null);
					for (var operation in relinkOperators) {
						relinkOperators[operation].relink(tiddler, fromTitle, toTitle, entries, options);
					}
					for (var field in entries) {
						// So long as there is one key,
						// add it to the change list.
						changeList[title] = entries;
						break;
					}
				} catch (e) {
					// Should we test for instanceof Error instead?: yes
					// Does that work in the testing environment?: no
					if (e.message) {
						e.message = e.message + "\nWhen relinking '" + title + "'";
					}
					throw e;
				}
			}
		}
	}
	return changeList;
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
