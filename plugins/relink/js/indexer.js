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
};

ReferencesIndexer.prototype.update = function(updateDescriptor) {
	if (!this.index) {
		return;
	}
	var changedTiddlers = {},
		title;
	if (updateDescriptor.old.exists) {
		title = updateDescriptor.old.tiddler.fields.title;
		changedTiddlers[title] = {deleted: true};
	}

	if (updateDescriptor['new'].exists) {
		// If its the same tiddler as old, this overrides the 'deleted' entry
		title = updateDescriptor['new'].tiddler.fields.title;
		changedTiddlers[title] = {modified: true};
	}
	if (this.context.changed(changedTiddlers) || this.context.parent.changed(changedTiddlers)) {
		// If global macro context or whitelist context changed, wipe all
		this.index = null;
	} else {
		if (updateDescriptor.old.exists) {
			title = updateDescriptor.old.tiddler.fields.title;
			delete this.index[title];
			delete this.contexts[title];
		}
		for (title in this.contexts) {
			var tiddlerContext = this.contexts[title];
			if (tiddlerContext.changed(changedTiddlers)) {
				delete this.index[title];
				delete this.contexts[title];
			}
		}
	}
};

ReferencesIndexer.prototype.lookup = function(title) {
	if (!this.index) {
		this.index = Object.create(null);
		this.context = utils.getWikiContext(this.wiki);
	}
	if (!this.index[title]) {
		var tiddlerContext = new TiddlerContext(this.wiki, this.context, title);
		this.index[title] = utils.getTiddlerRelinkReferences(this.wiki, title, tiddlerContext);
		this.contexts[title] = tiddlerContext;
	}
	return this.index[title];
};

exports.RelinkReferencesIndexer = ReferencesIndexer;
