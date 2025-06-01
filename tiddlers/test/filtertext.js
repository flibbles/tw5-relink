/*\

Tests relinking in filter tiddlers. (text/x-tiddler-filter)

\*/

var utils = require("./utils");

describe("filtertext", function() {

beforeEach(function() {
	spyOn(console, 'log');
	utils.spyFailures(spyOn);
});

function testDefault(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/vnd.tiddlywiki";
	var results = utils.relink({text: text, type: type}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(utils.failures).toHaveBeenCalledTimes(options.fails || 0);
};

it('manages exception tiddlers like $:/DefaultTiddlers', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.exceptionConf('test'));
	testDefault("[[from here]]", {wiki: wiki});
	testDefault("[tag[from here]]", {wiki: wiki});
	testDefault("from", "to", {from: "from", to: "to", wiki: wiki});
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
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.exceptionConf('test'));
	testDefault(text, text, {to: "brackets[[in]]title", fails: 1, wiki: wiki});
});

});
