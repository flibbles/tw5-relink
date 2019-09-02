/*\
module-type: relinkwikitextrule

Handles import pragmas

\import [tag[MyTiddler]]
\*/

var settings = require("$:/plugins/flibbles/relink/js/settings.js");
var log = require("$:/plugins/flibbles/relink/js/language.js").logRelink;
var filterRelinker = settings.getRelinker('filter');

exports.name = "import";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	// In this one case, I'll let the parser parse out the filter and move
	// the ptr.
	var start = this.matchRegExp.lastIndex;
	var parseTree = this.parse();
	var filter = parseTree[0].attributes.filter.value;
	var extendedOptions = Object.assign({placeholder: this.parser},options);
	var value = filterRelinker(filter, fromTitle, toTitle, extendedOptions);
	if (value !== undefined) {
		var message = extendedOptions.usedPlaceholder ? "import-placeholder" : "import";
		log(message, {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title
		}, options);
		var newline = text.substring(start+filter.length, this.parser.pos);
		return "\\import " + value + newline;
	}
	return undefined;
};
