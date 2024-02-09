/*\
module-type: indexer

Indexes results from tiddler reference reports so we don't have to call them
so much.

\*/

"use strict";

var utils = require("./utils.js");
var TiddlerContext = utils.getContext('tiddler');

function Indexer(wiki) {
	this.wiki = wiki;
};

Indexer.prototype.init = function() {
	this.rebuild();
};

Indexer.prototype.rebuild = function() {
	this.index = null;
	this.backIndex = null;
	this.contexts = Object.create(null);
	this.changedTiddlers = undefined;
	this.lastRelinks = Object.create(null);
};

Indexer.prototype.update = function(updateDescriptor) {
	if (!this.index) {
		return;
	}
	var title;
	if (!this.changedTiddlers) {
		this.changedTiddlers = Object.create(null);
	}
	if (updateDescriptor.old.exists) {
		title = updateDescriptor.old.tiddler.fields.title;
		this.changedTiddlers[title] = {deleted: true};
		this._purge(title);
	}
	if (updateDescriptor['new'].exists) {
		// If its the same tiddler as old, this overrides the 'deleted' entry
		title = updateDescriptor['new'].tiddler.fields.title;
		this.changedTiddlers[title] = {modified: true};
	}
};

Indexer.prototype.lookup = function(title) {
	this._upkeep();
	return this.index[title];
};

Indexer.prototype.reverseLookup = function(title) {
	this._upkeep();
	return this.backIndex[title] || Object.create(null);
};

Indexer.prototype.relinkLookup = function(fromTitle, toTitle, options) {
	this._upkeep();
	var shortlist = undefined;
	var lastRelink = this.lastRelinks[fromTitle];
	if (lastRelink) {
		if (lastRelink.to === toTitle) {
			// We need to reintroduce the relink cache, where temporary info
			// was stored.
			options.cache = lastRelink.cache;
			return lastRelink.results;
		}
		shortlist = buildShortlist(lastRelink);
	}
	var results = utils.getRelinkResults(this.wiki, fromTitle, toTitle, this.context, shortlist, options);
	if (Object.keys(this.lastRelinks).length > 3) {
		// The cache got a little large. wipe it clean.
		this.lastRelinks = Object.create(null);
	}
	this.lastRelinks[fromTitle] = {
		from: fromTitle,
		results: results,
		to: toTitle,
		cache: options.cache,
		maybeRelevant: Object.create(null)};
	return results;
};

// Returns all tiddlers that don't have anything referencing it.
Indexer.prototype.orphans = function(options) {
	this._upkeep();
	var results = [];
	var ignoreList = (options && options.ignore) || [];
	var ignoreMap = Object.create(null);
	for (var i = 0; i < ignoreList.length; i++) {
		ignoreMap[ignoreList[i]] = true;
	}
	for (var title in this.index) {
		var index = this.backIndex[title];
		var owned = false;
		if (index) {
			for (var key in index) {
				if (!ignoreMap[key]) {
					owned = true;
					break;
				}
			}
		}
		if (!owned) {
			results.push(title);
		}
	}
	return results;
};

Indexer.prototype._upkeep = function() {
	var title;
	if (this.changedTiddlers && (this.context.changed(this.changedTiddlers) || this.context.parent.changed(this.changedTiddlers))) {
		// If global macro context or whitelist context changed, wipe all
		this.rebuild();
	}
	if (!this.index) {
		this.index = Object.create(null);
		this.backIndex = Object.create(null);
		this.context = utils.getWikiContext(this.wiki);
		var titles = this.wiki.getRelinkableTitles();
		for (var i = 0; i < titles.length; i++) {
			this._populate(titles[i]);
		};
	} else if (this.changedTiddlers) {
		// If there are cached changes, we apply them now.
		for (title in this.contexts) {
			var tiddlerContext = this.contexts[title];
			if (tiddlerContext.changed(this.changedTiddlers)) {
				this._purge(title);
				this._populate(title);
				this._decacheRelink(title);
				// Wipe this change, so we don't risk updating it twice.
				this.changedTiddlers[title] = undefined;
			}
		}
		for (title in this.changedTiddlers) {
			var change = this.changedTiddlers[title];
			if (change && change.modified) {
				this._purge(title);
				this._populate(title);
				this._decacheRelink(title);
			}
		}
		this.changedTiddlers = undefined;
	}
};

Indexer.prototype._purge = function(title) {
	for (var entry in this.index[title]) {
		delete this.backIndex[entry][title];
	}
	delete this.contexts[title];
	delete this.index[title];
};

// This drops the cached relink results if unsanctioned tiddlers were changed
Indexer.prototype._decacheRelink = function(title) {
	var tiddler = this.wiki.getTiddler(title);
	for (var from in this.lastRelinks) {
		var lastRelink = this.lastRelinks[from];
		if (title !== from
		&& title !== lastRelink.to
		&& (!tiddler
		|| !$tw.utils.hop(tiddler.fields, 'draft.of') // is a draft
		|| tiddler.fields['draft.of'] !== from// draft of target
		|| references(this.index[title], from))) { // draft references target
			// This is not the draft of the last relinked title,
			// so our cached results should be wiped.
			lastRelink.maybeRelevant[title] = true;
			// Force this cached relink to partially refresh when it comes time
			lastRelink.to = undefined;
		}
	}
};

function references(list, item) {
	return list !== undefined && list[item];
};

// Compiles a short list of tiddlers we need to check for a rename.
// This list will be much faster to relink again.
function buildShortlist(lastRelink) {
	var shortlist = Object.keys(lastRelink.results);
	for (var title in lastRelink.maybeRelevant) {
		if (lastRelink.results[title] === undefined) {
			shortlist.push(title);
		}
	}
	return shortlist;
};

Indexer.prototype._populate = function(title) {
	// Fetch the report for a title, and populate the indexes with result
	var tiddlerContext = new TiddlerContext(this.wiki, this.context, title);
	var references = utils.getTiddlerRelinkReferences(this.wiki, title, tiddlerContext);
	this.index[title] = references;
	if (tiddlerContext.hasImports()) {
		this.contexts[title] = tiddlerContext;
	}
	for (var ref in references) {
		this.backIndex[ref] = this.backIndex[ref] || Object.create(null);
		this.backIndex[ref][title] = references[ref];
	}
};

exports.RelinkIndexer = Indexer;
