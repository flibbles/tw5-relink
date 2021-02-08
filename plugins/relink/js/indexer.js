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
	/*
	if (updateDescriptor.old.exists) {
		delete this.index[updateDescriptor.old.tiddler.fields.title];
	}
	*/
};

ReferencesIndexer.prototype.lookup = function(title) {
	if (!this.index) {
		this.index = Object.create(null);
	}
	if (!this.index[title]) {
		this.index[title] = utils.getTiddlerRelinkReferences(this.wiki, title);
	}
	return this.index[title];
};

exports.RelinkReferencesIndexer = ReferencesIndexer;
