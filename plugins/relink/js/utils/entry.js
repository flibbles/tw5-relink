function EntryNode(name) {
	if (name) {
		this.name = name;
	}
	this.children = [];
};

module.exports = EntryNode;

EntryNode.newType = function(name) {
	function NewEntry() {
		EntryNode.apply(this, arguments);
	};
	NewEntry.prototype = Object.create(EntryNode.prototype);
	NewEntry.prototype.name = name;
	return NewEntry;
};

EntryNode.prototype.add = function(entry) {
	this.placeholder = this.placeholder || entry.placeholder;
	this.widget = this.widget || entry.widget;
	this.children.push(entry);
};

EntryNode.prototype.report = function() {
	var output = [];
	if (!this.children) {
		return [this.output];
	}
	for (var i = 0; i < this.children.length; i++) {
		var child = this.children[i];
		var subOccurs;
		if (child.report) {
			subOccurs = child.report();
		} else {
			subOccurs = ["FILLIN"];
		}
		for (var x = 0; x < subOccurs.length; x++) {
			output.push(subOccurs[x]);
		}
	}
	return output;
};
