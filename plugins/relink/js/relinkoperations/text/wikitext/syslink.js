/*\
module-type: relinkwikitextrule

Handles sys links

$:/sys/link

but not:

~$:/sys/link

\*/

var utils = require("./utils.js");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = "syslink";

var SyslinkEntry = EntryNode.newType("syslink");

SyslinkEntry.prototype.report = function() {
	return ["~" + this.link];
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = undefined;
	this.parser.pos = this.matchRegExp.lastIndex;
	if (this.match[0] === fromTitle && this.match[0][0] !== "~") {
		entry = new SyslinkEntry();
		entry.link = fromTitle;
		entry.output = this.makeSyslink(toTitle, options);
		if (entry.output === undefined) {
			entry.impossible = true;
		}
	}
	return entry;
};

exports.makeSyslink = function(title, options) {
	var rtn = undefined;
	var match = title.match(this.matchRegExp);
	if (match && match[0] === title && title[0] !== "~") {
		rtn = title;
	} else if (utils.canBePretty(title)) {
		rtn = "[[" + title + "]]";
	} else if (options.placeholder) {
		var ph = options.placeholder.getPlaceholderFor(title);
		rtn = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
	}
	return rtn;
};
