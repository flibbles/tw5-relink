/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[[Introduction]]

[[link description|TiddlerTitle]]

\*/

var utils = require("./utils.js");

function PrettyLinkEntry() {};
PrettyLinkEntry.prototype.name = "prettylink";
PrettyLinkEntry.prototype.report = function() {
	return ["[[" + (this.caption || this.link) + "]]"];
};

exports.name = "prettylink";

exports.relink = function(text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var caption, quoted, m = this.match;
	if (m[2] === fromTitle) {
		// format is [[caption|MyTiddler]]
		caption = m[1];
	} else if (m[2] !== undefined || m[1] !== fromTitle) {
		// format is [[MyTiddler]], and it doesn't match
		return undefined;
	}
	var entry = new PrettyLinkEntry();
	entry.caption = caption;
	entry.link = toTitle;
	entry.output = this.makeLink(toTitle, caption, options);
	if (entry.output === undefined) {
		entry.impossible = true;
	}
	return entry;
};

exports.makeLink = function(tiddler, caption, options) {
	var output;
	if (utils.canBePretty(tiddler)) {
		output = prettyLink(tiddler, caption);
	} else if (caption === undefined) {
		// If we don't have a caption, we have to resort to placeholders
		// anyway to prevent link/caption desync from later relinks.
		// It doesn't matter whether the tiddler is quotable
		if (options.placeholder) {
			var ph = options.placeholder.getPlaceholderFor(tiddler);
			output = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
		}
	} else if (quoted = utils.wrapAttributeValue(tiddler)) {
		var safeCaption = sanitizeCaption(caption, options);
		if (safeCaption !== undefined) {
			output = "<$link to="+quoted+">"+safeCaption+"</$link>";
		}
	} else if (options.placeholder) {
		var ph = options.placeholder.getPlaceholderFor(tiddler);
		// We don't test if caption is undefined here, because it
		// never will be. options.placeholder exists.
		var safeCaption = sanitizeCaption(caption, options);
		output = "<$link to=<<"+ph+">>>"+safeCaption+"</$link>";
	}
	return output;
};

function sanitizeCaption(caption, options) {
	var plaintext = options.wiki.renderText("text/plain", "text/vnd.tiddlywiki", caption);
	if (plaintext === caption && caption.indexOf("</$link>") <= 0) {
		return caption;
	} else {
		var wrapped = utils.wrapAttributeValue(caption);
		if (wrapped) {
			return "<$text text="+wrapped+"/>";
		} else if (options.placeholder) {
			var ph = options.placeholder.getPlaceholderFor(caption, "caption");
			return "<$text text=<<"+ph+">>/>";
		} else {
			return undefined;
		}
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
