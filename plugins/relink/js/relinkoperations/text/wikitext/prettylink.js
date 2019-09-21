/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[[Introduction]]

[[link description|TiddlerTitle]]

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var utils = require("./utils.js");

exports.name = "prettylink";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var caption, quoted, m = this.match;
	if (m[2] === fromTitle) {
		// format is [[caption|MyTiddler]]
		caption = m[1];
	} else if (m[2] !== undefined || m[1] !== fromTitle) {
		// format is [[MyTiddler]], and it doesn't match
		return undefined;
	}
	var logArguments = {
		from: fromTitle,
		to: toTitle,
		tiddler: tiddler.fields.title
	};
	if (utils.canBePretty(toTitle)) {
		log("prettylink", logArguments, options);
		return prettyLink(toTitle, caption);
	} else if (caption === undefined) {
		// If we don't have a caption, we have to resort to placeholders
		// anyway to prevent link/caption desync from later relinks.
		// It doesn't matter whether the toTitle is quotable
		log("prettylink-placeholder", logArguments, options);
		var ph = this.parser.getPlaceholderFor(toTitle);
		return "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
	} else if (quoted = utils.wrapAttributeValue(toTitle)) {
		log("prettylink-widget", logArguments, options);
		return "<$link to="+quoted+">"+caption+"</$link>";
	} else {
		log("prettylink-placeholder", logArguments, options);
		var ph = this.parser.getPlaceholderFor(toTitle);
		return "<$link to=<<"+ph+">>>"+caption+"</$link>";
	}
};

function prettyLink(title, caption) {
	if (caption) {
		return "[[" + caption + "|" + title + "]]";
	} else {
		return "[[" + title + "]]";
	}
};

function isSafe(value) {
	return value.indexOf("]]") < 0 && value[value.length-1] !== ']';
};
