/*\

Tests relinking in markdown tiddlers. (text/markdown)

\*/

var utils = require("test/utils");

function test(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/markdown";
	var failCount = options.fails || 0;
	var results = utils.relink({text: text, type: type}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
};

describe("markdown text", function() {

it('can still treat markdown like wikitext', function() {
	test("[[from here]]", "[[to there]]");
});

it('updates markdown links', function() {
	test("click [here](#from) for link", {from: "from", to: "to"});
});

});
