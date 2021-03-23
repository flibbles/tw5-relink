/*\

Entries are deprecated. Don't use them. These classes are here just so that
any 3rd party modules built for Relink V1 don't break.

Just return an object like, {output: "string", impossible: true|undefined}

\*/

function EntryNode() {
	this.children = [];
};

module.exports = EntryNode;

/**  PURE VIRTUAL
 * EntryNode.prototype.report = function() -> ["string", ...]
 */

EntryNode.newType = function(name) {
	function NewEntry() {
		EntryNode.apply(this, arguments);
	};
	NewEntry.prototype = Object.create(EntryNode.prototype);
	NewEntry.prototype.name = name;
	return NewEntry;
};

// TODO: very temporary
EntryNode.prototype.isImpossible = function(rootEntry) {
	if (rootEntry.impossible) {
		return true;
	}
	var imp = false;
	var self = this;
	if (rootEntry.eachChild) {
		rootEntry.eachChild(function(child) {
			if (child) {
				imp = imp || self.isImpossible(child);
			}
		});
	}
	return imp;
};

EntryNode.prototype.eachChild = function(method) {
	if (this.children) {
		for (var i = 0; i < this.children.length; i++) {
			method(this.children[i]);
		}
	}
};

EntryNode.prototype.add = function(entry) {
	this.children.push(entry);
};

function EntryCollection() {
	this.children = Object.create(null);
	this.types = Object.create(null);
};

EntryNode.newCollection = function(name) {
	function NewCollection() {
		EntryCollection.apply(this, arguments);
	};
	NewCollection.prototype = Object.create(EntryCollection.prototype);
	NewCollection.prototype.name = name;
	return NewCollection;
};

EntryCollection.prototype.eachChild = function(method) {
	for (var child in this.children) {
		method(this.children[child]);
	}
};

EntryCollection.prototype.addChild = function(child, name, type) {
	this.children[name] = child;
	this.types[name] = type;
};

EntryCollection.prototype.hasChildren = function() {
	return Object.keys(this.children).length > 0;
};
