function EntryNode(name) {
	this.name = name;
	this.children = [];
};

module.exports = EntryNode;

EntryNode.prototype.add = function(entry) {
	this.impossible = this.impossible || entry.impossible;
	this.placeholder = this.placeholder || entry.placeholder;
	this.widget = this.widget || entry.widget;
	this.children.push(entry);
};

