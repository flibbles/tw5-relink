/*\
module-type: relinkwikitextrule

Handles import pragmas

\import [tag[MyTiddler]]
\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var filterRelinker = utils.getType('filter');
var ImportContext = utils.getContext('import');

exports.name = "import";

function ImportEntry(filterEntry) {
	this.filter = filterEntry;
};
ImportEntry.prototype.name = "import";
ImportEntry.prototype.eachChild = function(block) { return block(this.filter);};
ImportEntry.prototype.report = function() {
	return this.filter.report().map(function(report) {
		if (report.length > 0) {
			return "\\import " + report;
		} else {
			return "\\import";
		}
	});
};

exports.report = function(text, callback, options) {
	// This moves the pos for us
	var parseTree = this.parse();
	var filter = parseTree[0].attributes.filter.value || '';
	filterRelinker.report(filter, function(title, blurb) {
		if (blurb) {
			blurb = '\\import ' + blurb;
		} else {
			blurb = '\\import';
		}
		callback(title, blurb);
	}, options);
	// Before we go, we need to actually import the variables
	// it's calling for, and any /relink pragma
	this.parser.context = new ImportContext(options.wiki, this.parser.context, filter);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	// In this one case, I'll let the parser parse out the filter and move
	// the ptr.
	var start = this.matchRegExp.lastIndex;
	var parseTree = this.parse();
	var filter = parseTree[0].attributes.filter.value || '';
	var entry = undefined;
	var filterEntry = filterRelinker.relink(filter, fromTitle, toTitle, options);
	if (filterEntry !== undefined) {
		entry = new ImportEntry(filterEntry);
		var newline = text.substring(start+filter.length, this.parser.pos);
		if (filterEntry.output) {
			filter = filterEntry.output;
			entry.output = "\\import " + filter + newline;
		}
	}

	// Before we go, we need to actually import the variables
	// it's calling for, and any /relink pragma
	this.parser.context = new ImportContext(options.wiki, this.parser.context, filter);

	return entry;
};
