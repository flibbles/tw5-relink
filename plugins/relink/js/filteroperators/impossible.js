/*\
module-type: relinkfilteroperator

Given an input of toTitles, (probably just one), outputs all the tiddlers in
which Relink would fail to update the operand to any of those given titles.

`[[{terrible'}!!"title"]relink:impossible[fromTiddler]]`

Would output all the tiddlers where Relink would fail to update `from here` to
`{terrible'}!!"title"`

I know, it's weird. You'd think it would test all incoming inputs instead of
using them as to fromTitle, but this is the only way to input both a fromTitle
and a toTitle.

Results are dominantly appanded if more than one input tiddler is given.
\*/

var language = require("$:/plugins/flibbles/relink/js/language.js");

exports.impossible = function(source,operator,options) {
	var fromTitle = operator.operand,
		results = [];
	if (fromTitle) {
		source(function(toTiddler, toTitle) {
			var records = options.wiki.getRelinkableTiddlers(
				fromTitle, toTitle, options);
			for (var title in records) {
				var fields = records[title];
				var impossible = false;
				for (var field in fields) {
					language.eachImpossible(fields[field], function() {
						impossible = true;
					});
				}
				if (impossible) {
					$tw.utils.pushTop(results, title);
				}
			};
		});
	}
	return results;
};
