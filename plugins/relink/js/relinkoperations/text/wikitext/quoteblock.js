/*\
module-type: relinkwikitextrule

Handles the quote blocks, as in:

<<<
...
<<<

\*/

var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");

exports.name = "quoteblock";

exports.type = {block: true};

exports.report = function(text, callback, options) {
	var reEndString = "^" + this.match[1] + "(?!<)";
	this.parser.pos = this.matchRegExp.lastIndex;

	this.parser.parseClasses();
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});

	// Parse the optional cite
	reportCite(this.parser, this.match[1]);
	// Now parse the body of the quote
	this.parser.parseBlocks(reEndString);
	// Now parse the closing cite
	reportCite(this.parser, this.match[1]);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var reEndString = "^" + this.match[1] + "(?!<)";
	var builder = new Rebuilder(text, this.parser.pos);
	var entry;
	this.parser.pos = this.matchRegExp.lastIndex;

	this.parser.parseClasses();
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});

	// Parse the optional cite
	mergeRelinks(builder, this.parser.parseInlineRun(/(\r?\n)/mg));
	// Now parse the body of the quote
	mergeRelinks(builder, this.parser.parseBlocks(reEndString));
	// Now parse the closing cite
	mergeRelinks(builder, this.parser.parseInlineRun(/(\r?\n)/mg));

	if (builder.changed() || builder.impossible) {
		entry = {};
		entry.output = builder.results(this.parser.pos);
		if (builder.impossible) {
			entry.impossible = true;
		}
	}
	return entry;
};

function reportCite(parser, delimeter) {
	var callback = parser.callback;
	try {
		parser.callback = function(title, blurb) {
			return callback(title, delimeter + " " + blurb);
		};
		parser.parseInlineRun(/(\r?\n)/mg);
	} finally {
		parser.callback = callback;
	}
};

function mergeRelinks(builder, output) {
	if (output.length > 0) {
		for (var i = 0; i < output.length; i++) {
			var o = output[i];
			if (o.output) {
				builder.add(o.output, o.start, o.end);
			}
			if (o.impossible) {
				builder.impossible = true;
			}
		}
	}
};
