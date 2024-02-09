/*\
module-type: relinkwikitextrule

Handles replacement of conditionals

<%if Tiddler %>

<%elseif TiddlerB %>

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var filterRelinker = utils.getType('filter');

exports.name = "conditional";

exports.report = function(text, callback, options) {
	var match = this.match;
	var keyword = '<%if ';
	var reEndString = "\\<\\%\\s*(endif)\\s*\\%\\>|\\<\\%\\s*(else)\\s*\\%\\>|\\<\\%\\s*(elseif)\\s+([\\s\\S]+?)\\%\\>";
	this.parser.pos = this.terminateIfMatch.index + this.terminateIfMatch[0].length;
	var ex;
	var filter = this.parser.source.substring(match.index + match[0].length, this.terminateIfMatch.index);
	while (true) {
		if (filter) {
			filterRelinker.report(filter, function(title, blurb, style) {
				if (blurb) {
					blurb = keyword + blurb + ' %>';
				} else {
					blurb = keyword + '%>';
				}
				callback(title, blurb, style);
			}, options);
		}
		var hasLineBreak = doubleLineBreakAtPos(this.parser);
		// Parse the body looking for else or endif
		if (hasLineBreak) {
			ex = this.parser.parseBlocksTerminatedExtended(reEndString);
		} else {
			var reEnd = new RegExp(reEndString,"mg");
			ex = this.parser.parseInlineRunTerminatedExtended(reEnd,{eatTerminator: true});
		}
		if (ex.match) {
			match = ex.match;
			if (ex.match[3] === "elseif") {
				keyword = '<%elseif ';
				filter = ex.match[4];
				continue;
			} else if (ex.match[2] === "else") {
				reEndString = "\\<\\%\\s*(endif)\\s*\\%\\>";
				filter = null;
				continue;
			}
		}
		break;
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var conditionEntry = {};
	var builder = new Rebuilder(text, this.match.index);
	var reEndString = "\\<\\%\\s*(endif)\\s*\\%\\>|\\<\\%\\s*(else)\\s*\\%\\>|\\<\\%\\s*(elseif)\\s+([\\s\\S]+?)\\%\\>";
	this.parser.pos = this.terminateIfMatch.index + this.terminateIfMatch[0].length;
	var ex;
	var filter = this.parser.source.substring(this.match.index + this.match[0].length, this.terminateIfMatch.index);
	var endOfFilter = this.terminateIfMatch.index;
	while (true) {
		if (filter) {
			var entry = filterRelinker.relink(filter, fromTitle, toTitle, options);
			if (entry) {
				if (entry.output) {
					if (entry.output.indexOf('%>') > 0) {
						builder.impossible = true;
					} else {
						builder.add(entry.output, endOfFilter - filter.length, endOfFilter);
					}
				}
				if (entry.impossible) {
					builder.impossible = true;
				}
			}
		}
		var hasLineBreak = doubleLineBreakAtPos(this.parser);
		// Parse the body looking for else or endif
		if (hasLineBreak) {
			ex = this.parser.parseBlocksTerminatedExtended(reEndString);
		} else {
			var reEnd = new RegExp(reEndString,"mg");
			ex = this.parser.parseInlineRunTerminatedExtended(reEnd,{eatTerminator: true});
		}
		for (var i = 0; i < ex.tree.length; i++) {
			var child = ex.tree[i];
			if (child.output) {
				builder.add(child.output, child.start, child.end);
			}
			if (child.impossible) {
				builder.impossible = true;
			}
		}
		if (ex.match) {
			if (ex.match[3] === "elseif") {
				filter = ex.match[4];
				endOfFilter = ex.match.index + ex.match[0].length - 2;
				continue;
			} else if (ex.match[2] === "else") {
				filter = null;
				reEndString = "\\<\\%\\s*(endif)\\s*\\%\\>";
				continue;
			}
		}
		break;
	}
	if (builder.changed() || builder.impossible) {
		conditionEntry = {
			output: builder.results(this.parser.pos),
			impossible: builder.impossible };
	}
	return conditionEntry;
};

function doubleLineBreakAtPos(parser) {
	return !!$tw.utils.parseTokenRegExp(parser.source, parser.pos, /([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/g);
};
