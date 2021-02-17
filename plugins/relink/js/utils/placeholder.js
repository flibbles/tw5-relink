/*\

A method which doles out placeholders when requested, and constructs
the necessary supporting pragma when requested.

\*/

var utils = require('../utils');

function Placeholder() {
	this.placeholders = Object.create(null);
	this.reverseMap = Object.create(null);
	this.used = Object.create(null);
};

module.exports = Placeholder;

Placeholder.prototype.getPlaceholderFor = function(value, category, options) {
	var placeholder = this.reverseMap[value];
	// TODO: This needs to distinguish reverseMaps for each category type, or
	//       there might be a nasty conflict.
	if (placeholder) {
		return placeholder;
	}
	var config = (this.parser ? this.parser.context : options.settings) || utils.getWikiContext(options.wiki);
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
	} while (config.getMacroDefinition(placeholder) || this.used[placeholder]);
	this.placeholders[placeholder] = value;
	this.reverseMap[value] = placeholder;
	this.used[placeholder] = true;
	return placeholder;
};

// For registering placeholders that already existed
Placeholder.prototype.registerExisting = function(key, value) {
	this.reverseMap[value] = key;
	this.used[key] = true;
};

Placeholder.prototype.getPreamble = function() {
	var results = [];
	for (var name in this.placeholders) {
		var val = this.placeholders[name];
		results.push("\\define "+name+"() "+val+"\n");
	}
	return results.join('');
};

