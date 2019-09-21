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

	var extendedOptions = $tw.utils.extend({placeholder: this.parser},options);
	var value = filterRelinker.relink(filter, fromTitle, toTitle, extendedOptions);
	var rtn = undefined;
	if (value !== undefined) {
		var message = extendedOptions.usedPlaceholder ? "import-placeholder" : "import";
		log(message, {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title
		}, options);
		var newline = text.substring(start+filter.length, this.parser.pos);
		filter = value;
		rtn = "\\import " + value + newline;
	}

	// Before we go, we need to actually import the variables
	// it's calling for.
	var parentWidget = this.parser.getVariableWidget();
	var variableHolder = options.wiki.relinkGenerateVariableWidget(filter, parentWidget);
	this.parser.addWidget(variableHolder);

	return rtn;
};
