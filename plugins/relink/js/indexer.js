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
	if (this.context.changed(this.changedTiddlers) || this.context.parent.changed(this.changedTiddlers)) {
		// If global macro context or whitelist context changed, wipe all
		this.rebuild();
	} else {
		if (updateDescriptor.old.exists) {
			title = updateDescriptor.old.tiddler.fields.title;
			delete this.index[title];
			delete this.contexts[title];
		}
	}
};

ReferencesIndexer.prototype.lookup = function(title) {
	if (!this.index) {
		// If there is no index at all, let's start it up.
		this.index = Object.create(null);
		this.context = utils.getWikiContext(this.wiki);
	} else if (this.changedTiddlers) {
		// If there are cached changes, we apply them now.
		for (title in this.contexts) {
			var tiddlerContext = this.contexts[title];
			if (tiddlerContext.changed(this.changedTiddlers)) {
				delete this.index[title];
				delete this.contexts[title];
			}
		}
		this.changedTiddlers = undefined;
	}
	// Now we try to fetch the report for this given tiddlers
	if (!this.index[title]) {
		var tiddlerContext = new TiddlerContext(this.wiki, this.context, title);
		this.index[title] = utils.getTiddlerRelinkReferences(this.wiki, title, tiddlerContext);
		if (tiddlerContext.hasImports()) {
			this.contexts[title] = tiddlerContext;
		}
	}
	return this.index[title];
};

exports.RelinkReferencesIndexer = ReferencesIndexer;
