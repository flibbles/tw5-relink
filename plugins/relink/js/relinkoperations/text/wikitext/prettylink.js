/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[[Introduction]]

[[link description|TiddlerTitle]]

\*/

var utils = require("./utils.js");
var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');

exports.name = "prettylink";

exports.report = function(text, callback, options) {
	var text = this.match[1],
		link = this.match[2] || text;
	if (!$tw.utils.isLinkExternal(link)) {
		var type = relinkUtils.getType('title');
		type.report(link, function(title) {
			callback(title, '[[' + text + ']]');
		}, options);
	}
	this.parser.pos = this.matchRegExp.lastIndex;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var type = relinkUtils.getType('title'),
		caption = this.match[1],
		link = this.match[2] || caption,
		entry = type.relink(link, fromTitle, toTitle, options);
	if (entry && !entry.impossible) {
		entry.output = utils.makePrettylink(this.parser, entry.output, this.match[2] && caption);
		if (entry.output === undefined) {
			entry.impossible = true;
		}
	}
	this.parser.pos = this.matchRegExp.lastIndex;
	return entry;
};
