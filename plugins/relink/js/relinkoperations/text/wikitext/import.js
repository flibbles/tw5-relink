/*\
module-type: relinkwikitextrule

Handles import pragmas

\import [tag[MyTiddler]]
\*/

var settings = require("$:/plugins/flibbles/relink/js/settings.js");
var filterRelinker = settings.getRelinker('filter');

exports['import'] = function(tiddler, text, fromTitle, toTitle, options) {
	// In this one case, I'll let the parser parse out the filter and move
	// the ptr.
	var start = this.matchRegExp.lastIndex;
	var parseTree = this.parse();
	var filter = parseTree[0].attributes.filter.value;
	var handler = new ImportHandler(tiddler, filter);
	var value = filterRelinker(handler, fromTitle, toTitle, options);
	if (value !== undefined) {
		var newline = text.substring(start+filter.length, this.parser.pos);
		return "\\import " + value + newline;
	}
	return undefined;
};

function ImportHandler(tiddler, value) {
	this.tiddler = tiddler;
	this._value = value;
};

ImportHandler.prototype.log = function(){};
ImportHandler.prototype.value = function() { return this._value; }
