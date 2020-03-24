/*\
module-type: relinkfilteroperator

Given a title as an operand, returns a string for each occurrence of that title
within each input title.

[[title]] +[relink:references[fromTiddler]]`

Returns string representation of fromTiddler occurrences in title.
\*/

exports.occurrences = function(source,operator,options) {
	var fromTitle = operator.operand,
		results = [],
		records = options.wiki.getRelinkableTiddlers(
			fromTitle, fromTitle, options);
	if (fromTitle) {
		source(function(tiddler, title) {
			var affectedFields = records[title];
			if (affectedFields) {
				for (var field in affectedFields) {
					var entry = affectedFields[field];
					var signatures = entry.occurrences(fromTitle);
					results = results.concat(signatures);
				}
			}
		});
	}
	return results;
};
