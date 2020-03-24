function EntryNode(name) {
	this.name = name;
	this.children = [];
};

module.exports = EntryNode;

EntryNode.prototype.add = function(entry) {
	this.placeholder = this.placeholder || entry.placeholder;
	this.widget = this.widget || entry.widget;
	this.children.push(entry);
};

EntryNode.prototype.sign = function(string) {
	return string;
};

EntryNode.prototype.occurrences = function(fromTitle) {
	var output = [];
	if (!this.children) {
		return [this.sign(fromTitle)];
	}
	for (var i = 0; i < this.children.length; i++) {
		var child = this.children[i];
		var subOccurs;
		if (child.occurrences) {
			subOccurs = child.occurrences(fromTitle);
		} else {
			subOccurs = [fromTitle];
		}
		for (var x = 0; x < subOccurs.length; x++) {
			output.push(this.sign(subOccurs[x]));
		}
	}
	return output;
};
