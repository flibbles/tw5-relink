/*\
module-type: indexer

Indexes results from tiddler reference reports so we don't have to call them
so much.

\*/

"use strict";

var utils = require("./utils.js");
var TiddlerContext = utils.getContext('tiddler');

function ReferencesIndexer(wiki) {
	this.wiki = wiki;
};

ReferencesIndexer.prototype.init = function() {
	this.rebuild();
};

ReferencesIndexer.prototype.rebuild = function() {
	this.index = null;
	this.backIndex = null;
	this.contexts = Object.create(null);
	this.changedTiddlers = undefined;
};

ReferencesIndexer.prototype.update = function(updateDescriptor) {
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
	}
	if (updateDescriptor['new'].exists) {
		// If its the same tiddler as old, this overrides the 'deleted' entry
		title = updateDescriptor['new'].tiddler.fields.title;
		this.changedTiddlers[title] = {modified: true};
	}
};

ReferencesIndexer.prototype.lookup = function(title) {
	this._upkeep();
	return this.index[title];
};

ReferencesIndexer.prototype.reverseLookup = function(title) {
	this._upkeep();
	return this.backIndex[title];
};

ReferencesIndexer.prototype._upkeep = function() {
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
		for (title in this.changedTiddlers) {
			this._purge(title);
			if (this.changedTiddlers[title].modified) {
				this._populate(title);
			}
		}
		// If there are cached changes, we apply them now.
		for (title in this.contexts) {
			var tiddlerContext = this.contexts[title];
			if (tiddlerContext.changed(this.changedTiddlers)) {
				this._purge(title);
				this._populate(title);
			}
		}
		this.changedTiddlers = undefined;
	}
};

ReferencesIndexer.prototype._purge = function(title) {
	for (var entry in this.index[title]) {
		delete this.backIndex[entry][title];
	}
	delete this.contexts[title];
	delete this.index[title];
};

ReferencesIndexer.prototype._populate = function(title) {
	// Now we try to fetch the report for this given tiddlers
	if (!this.index[title]) {
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
	}
};

exports.RelinkReferencesIndexer = ReferencesIndexer;
