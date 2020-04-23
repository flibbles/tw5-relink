/*\

A method which doles out placeholders when requested, and constructs
the necessary supporting pragma when requested.

\*/

function Placeholder() {
	this.placeholders = Object.create(null);
	this.reverseMap = Object.create(null);
	this.knownMacros = Object.create(null);
};

module.exports = Placeholder;

Placeholder.prototype.getPlaceholderFor = function(value, category, options) {
	var placeholder = this.reverseMap[value];
	if (placeholder) {
		return placeholder;
	}
	var number = 0;
	var prefix = "relink-"
	if (category && category !== "title") {
		// I don't like "relink-title-1". "relink-1" should be for
		// titles. lists, and filters can have descriptors though.
		prefix += category + "-";
	}
	do {
		number += 1;
		placeholder = prefix + number;
	} while (this.macroExists(placeholder, options));
	this.placeholders[placeholder] = value;
	this.reverseMap[value] = placeholder;
	this.reserve(placeholder);
	return placeholder;
};

Placeholder.prototype.macroExists = function(macroName, options) {
	if (this.knownMacros[macroName]) {
		return true;
	}
	if (options.settings && options.settings.getVariable(macroName)) {
		return true;
	}
	return false;
};

Placeholder.prototype.reserve = function(macro) {
	this.knownMacros[macro] = true;
};

Placeholder.prototype.getPreamble = function() {
	var results = [];
	for (var name in this.placeholders) {
		var val = this.placeholders[name];
		results.push("\\define "+name+"() "+val+"\n");
	}
	return results.join('');
};

