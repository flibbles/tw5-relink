/*\
module-type: relinkfilteroperator

Generator operator.

Given each input title, it returns all the tiddlers that would be changed if the currentTiddler were to be renamed to the operand.

If it has the suffix 'fail', then it instead filters all source titles to only
ones that would encounter an error on failure.

THIS IS AN INTERNAL FILTER OPERATOR AND IS NOT INTENDED TO BE USED BY USERS.

\*/

var language = require("$:/plugins/flibbles/relink/js/language.js");
var utils = require("$:/plugins/flibbles/relink/js/utils.js");

exports.wouldchange = function(source,operator,options) {
	var from = options.widget && options.widget.getVariable("currentTiddler"),
		to = operator.operand,
		results = [];
	var indexer = utils.getIndexer(options.wiki);
	var records = indexer.relinkLookup(from, to, options);
	if (operator.suffix !== 'fail') {
		return Object.keys(records);
	}
	source(function(tiddler, title) {
		var fields = records[title];
		if (fields) {
			var impossible = false;
			for (var field in fields) {
				language.eachImpossible(fields[field], function() {
					impossible = true;
				});
			}
			if (impossible) {
				results.push(title);
			}
		}
	});
	return results;
};

