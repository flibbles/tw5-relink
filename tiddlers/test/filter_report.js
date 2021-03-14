/*\

Tests the report filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray, extraTiddlers) {
	fromTitle = fields.from || "from";
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddlers(extraTiddlers || []);
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[["+tiddler.title+"]relink:report["+fromTitle+"]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: report', function() {

it("works on empty reports", function() {
	test({text: "This text has no links"}, []);
});

it("syslinks", function() {
	test({text: "Text $:/sys/link stuff", from: "$:/sys/link"},
	     ["~$:/sys/link"]);
});

it("filter fields", function() {
	test({"filter": "A from"}, ["filter"]);
	test({"filter": "A [tag[from]]"}, ["filter: [tag[]]"]);
	// Duplicates are allowed
	test({"filter": "A from B from"}, ["filter", "filter"]);
	test({"filter": "from [tag[from]]"}, ["filter","filter: [tag[]]"]);
});

});
