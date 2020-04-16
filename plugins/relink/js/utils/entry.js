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
