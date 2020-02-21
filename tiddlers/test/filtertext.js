/*\

Tests relinking in filter tiddlers. (text/x-tiddler-filter)

\*/

var utils = require("test/utils");

describe("filtertext", function() {

function testDefault(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/vnd.tiddlywiki";
	var results = utils.relink({text: text, type: type}, Object.assign({target: "$:/DefaultTiddlers"}, options));
	expect(results.tiddler.fields.text).toEqual(expected);
};

it('manages $:/DefaultTiddlers', function() {
	var options = {target: "$:/DefaultTiddlers"};
	testDefault("[[from here]]", options);
	testDefault("[tag[from here]]", options);
	testDefault("from", "to", Object.assign({from: "from", to: "to"}, options));
});

it('manages tiddlers with text/x-tiddler-filter type', function() {
	var options = {type: "text/x-tiddler-filter"};
	testDefault("[tag[from here]]", options);
});

});
