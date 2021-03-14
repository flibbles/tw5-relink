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

});
