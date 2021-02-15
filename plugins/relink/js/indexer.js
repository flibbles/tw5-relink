/*\
module-type: indexer

Indexes results from tiddler reference reports so we don't have to call them
so much.

\*/

"use strict";

var utils = require("./utils.js");

function ReferencesIndexer(wiki) {
	this.wiki = wiki;
};

ReferencesIndexer.prototype.init = function() {
	this.index = null;
};

ReferencesIndexer.prototype.rebuild = function() {
	this.index = null;
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

	// If its the same tiddler as old, this overrides the 'deleted' entry
	title = updateDescriptor['new'].tiddler.fields.title;
	changedTiddlers[title] = {modified: true};
	if (this.context.changed(changedTiddlers) || this.context.parent.changed(changedTiddlers)) {
		this.index = null;
	} else if (updateDescriptor.old.exists) {
		delete this.index[updateDescriptor.old.tiddler.fields.title];
	}
};

ReferencesIndexer.prototype.lookup = function(title) {
	if (!this.index) {
		this.index = Object.create(null);
		this.context = utils.getWikiContext(this.wiki);
	}
	if (!this.index[title]) {
		this.index[title] = utils.getTiddlerRelinkReferences(this.wiki, title, {settings: this.context});
	}
	return this.index[title];
};

exports.RelinkReferencesIndexer = ReferencesIndexer;
