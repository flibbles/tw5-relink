/*\
module-type: relinkfilteroperator

Given a title as an operand, returns all non-shadow tiddlers that have any
sort of updatable reference to it.


`relink:references[fromTiddler]]`

Returns all tiddlers that reference `fromTiddler` somewhere inside them.

Input is ignored. Maybe it shouldn't do this.
Also, maybe it should properly recon, instead of fake replacing the title with
`__relink_dummy__`
\*/

exports.references = function(source,operator,options) {
	var fromTitle = operator.operand,
		results = [];
	if (fromTitle) {
		options.wiki.eachRelinkableTiddler(
			fromTitle, "$:/plugins/flibbles/relink/dummy", options,
			function(entries, tiddler, title) {
				results.push(title);
			});
	}
	return results;
};
