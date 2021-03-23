/*\

Tests relinking in filter tiddlers. (text/x-tiddler-filter)

\*/

var utils = require("test/utils");

describe("filtertext", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

function testDefault(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/vnd.tiddlywiki";
	var failCount = options.fails || 0;
	var results = utils.relink({text: text, type: type}, Object.assign({target: "$:/DefaultTiddlers"}, options));
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
};

it('manages $:/DefaultTiddlers', function() {
	testDefault("[[from here]]");
	testDefault("[tag[from here]]");
	testDefault("from", "to", {from: "from", to: "to"});
});

it('manages tiddlers with text/x-tiddler-filter type', function() {
	var options = {type: "text/x-tiddler-filter", target: "something else"};
	testDefault("[tag[from here]]", options);
});

it('preserves whitespace', function() {
	testDefault("[[something else]]\n[[from here]]\n[tag[stuff]]");
});

it('throws error in case of failure', function() {
	var text = "[tag[from here]]";
	testDefault(text, text, {to: "brackets[[in]]title", fails: 1});
});

});
