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

exports.report = function(text, callback, options) {
	var text = this.match[1],
		link = this.match[2] || text;
	if (!$tw.utils.isLinkExternal(link)) {
		callback(link, '[[' + text + ']]');
	}
	this.parser.pos = this.matchRegExp.lastIndex;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var caption, m = this.match;
	if (m[2] === fromTitle) {
		// format is [[caption|MyTiddler]]
		caption = m[1];
	} else if (m[2] !== undefined || m[1] !== fromTitle) {
		// format is [[MyTiddler]], and it doesn't match
		return undefined;
	}
	var entry = new PrettyLinkEntry();
	entry.caption = caption;
	entry.link = fromTitle;
	entry.output = this.makeLink(this.parser.context, toTitle, caption, options);
	if (entry.output === undefined) {
		entry.impossible = true;
	}
	return entry;
};

exports.makeLink = function(context, tiddler, caption, options) {
	var output;
	if (context.allowPrettylinks() && this.canBePretty(tiddler, caption)) {
		output = prettyLink(tiddler, caption);
	} else if (caption !== undefined) {
		var safeCaption = sanitizeCaption(context, caption, options);
		if (safeCaption !== undefined) {
			output = utils.makeWidget(context, '$link', {to: tiddler}, safeCaption, options);
		}
	} else if (exports.shorthandSupported(options)) {
		output = utils.makeWidget(context, '$link', {to: tiddler}, undefined, options);
	} else if (context.allowWidgets() && options.placeholder) {
		// If we don't have a caption, we must resort to
		// placeholders anyway to prevent link/caption desync
		// from later relinks.
		// It doesn't matter whether the tiddler is quotable.
		var ph = options.placeholder.getPlaceholderFor(tiddler, undefined, options);
		output = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
	}
	return output;
};

/**Return true if value can be used inside a prettylink.
 */
exports.canBePretty = function(value, customCaption) {
	return value.indexOf("]]") < 0 && value[value.length-1] !== ']' && (customCaption !== undefined || value.indexOf('|') < 0);
};

/**In version 5.1.20, Tiddlywiki made it so <$link to"something" /> would
 * use "something" as a caption. This is preferable. However, Relink works
 * going back to 5.1.14, so we need to have different handling for both
 * cases.
 */
var _supported;
exports.shorthandSupported = function(options) {
	if (_supported === undefined) {
		var test = options.wiki.renderText("text/plain", "text/vnd.tiddlywiki", "<$link to=test/>");
		_supported = (test === "test");
	}
	return _supported;
};

function sanitizeCaption(context, caption, options) {
	var plaintext = options.wiki.renderText("text/plain", "text/vnd.tiddlywiki", caption);
	if (plaintext === caption && caption.indexOf("</$link>") <= 0) {
		return caption;
	} else {
		return utils.makeWidget(context, '$text', {text: caption}, undefined, options);
	}
};

function prettyLink(title, caption) {
	if (caption !== undefined) {
		return "[[" + caption + "|" + title + "]]";
	} else {
		return "[[" + title + "]]";
	}
};
