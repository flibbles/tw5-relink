/*\

Tests relinking titles of other tiddlers.

\*/

var utils = require("test/utils");


function test(target, expected, options) {
	var text;
	[text, expected, options] = utils.prepArgs("", expected, options);
	var failCount = options.fails || 0;
	options.target = target
	var results = utils.relink({text: text}, options);
	var changed = options.wiki.getTiddler(expected);
	expect(changed.fields.title).toEqual(expected);
	if (expected !== target) {
		expect(options.wiki.getTiddler(target)).toBeUndefined();
	}
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

function configTiddler(filter) {
	return {title: "$:/config/flibbles/relink/titles/filter", text: filter};
};

describe("titles", function() {

it("works at all", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(configTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>]"));
	test("$:/prefix/from here", "$:/prefix/to there", {wiki: wiki});
});

it("ignores unrelated tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(configTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>]"));
	test("$:/prefix/nothing", "$:/prefix/nothing", {wiki: wiki});
});

});
