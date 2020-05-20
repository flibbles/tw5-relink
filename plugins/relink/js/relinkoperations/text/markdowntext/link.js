/*\
module-type: relinkmarkdowntextrule

Handles markdown links

[caption](#link)

\*/

function MarkdownLinkEntry() {};
MarkdownLinkEntry.prototype.name = "markdownlink";
MarkdownLinkEntry.prototype.report = function() {
	return ["[" + this.caption + "](#)"];
};

exports.name = "markdownlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /\[([^\]]+)\]\(#([^)]+)\)/mg;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry, m = this.match;
	this.parser.pos = this.matchRegExp.lastIndex;
	if (m[2] === fromTitle) {
		var entry = new MarkdownLinkEntry();
		entry.caption = m[1];
		entry.output = this.makeLink(toTitle, m[1], options);
		if (entry.output === undefined) {
			entry.impossible = true;
		}
	}
	return entry;
};

exports.makeLink = function(title, caption, options) {
	return "[" + caption + "](#" + title + ")";
};

