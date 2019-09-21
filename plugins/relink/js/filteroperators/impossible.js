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

exports.impossible = function(source,operator,options) {
	var fromTitle = operator.operand,
		results = [];
	if (fromTitle) {
		source(function(toTiddler, toTitle) {
			var fails = options.wiki.eachRelinkableTiddler(
				fromTitle, toTitle,
				$tw.utils.extend({quiet: true}, options),
				function(tiddler, title) {});
			$tw.utils.pushTop(results, fails);
		});
	}
	return results;
};
