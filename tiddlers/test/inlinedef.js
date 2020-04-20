/*\

Tests inline macro definitions.

As in: \relink macroName macroParam:macroType ...

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var fields = Object.assign({text: text}, options.fields);
	var results = utils.relink(fields, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(options.fails || 0);
	return results;
};

describe("inlinedef", function() {

it('linedef macros', function() {
	var wiki = new $tw.Wiki();
	// local
	testText("\\relink test field:title\n<<test field: 'from here'>>");
	// imported
	wiki.addTiddler({title: "import", text: "\\relink test field:title"});
	testText("\\import import\n<<test field: 'from here'>>", {wiki: wiki});
	// global
	wiki = new $tw.Wiki();
	wiki.addTiddler({
		title: "global",
		text: "\\relink global field:title",
		tags: "$:/tags/Macro"});
	testText("<<global field: 'from here'>>", {wiki: wiki});
});

it('linedef macros update appropriately', function() {
	var wiki = new $tw.Wiki();
	// First patch in a method that performs update events synchronously
	utils.monkeyPatch($tw.utils, "nextTick", (fn) => fn(), function() {
		// First, force everything to instantiate
		testText("<<test 'from here'>>", {wiki: wiki, ignored: true});

		// Add a macro def and relink declaration,
		// and ensure macros update
		wiki.eventsTriggered = false;
		wiki.addTiddler({title: "macro", text: "\\define test(field) $field$\n\\relink test field:title", tags: "$:/tags/Macro"});
		testText("<<test field:'from here'>>", {wiki: wiki});

		// Next we modify an existing macro, and test it.
		wiki.eventsTriggered = false;
		wiki.addTiddler({title: "macro", text: "\\define test(field) $field$\n\\relink test field:reference", tags: "$:/tags/Macro"});
		testText("<<test field:'from here!!stuff'>>", {wiki: wiki});

		// Next we remove an existing macro, and ensure it's gone.
		wiki.eventsTriggered = false;
		wiki.deleteTiddler("macro");
		testText("<<test field:'from here!!stuff'>>", {ignored: true, wiki: wiki});
	});
});

it("linedef macros don't parse too much", function() {
	var wiki = new $tw.Wiki(), text;
	// Fully formed, it renders as nothing, but doesn't prevent later
	// macrodefs rom parsing.
	text = wiki.renderText( "text/plain", "text/vnd.tiddlywiki",
		"\\relink test p:title\n\\define test(p) Content\n<<test>>");
	expect(text).toEqual("Content");
	// When no parameters are assigned, it's ignored.
	text = wiki.renderText( "text/plain", "text/vnd.tiddlywiki",
		"\\relink test\n\\define test() Content\n<<test>>");
	expect(text).toEqual("Content");
	// If the \relink doesn't even specify a macro, then it won't parse
	// at all.
	text = wiki.renderText( "text/plain", "text/vnd.tiddlywiki",
		"\\relink\n\\define test() Content\n<<test>>");
	expect(text).toEqual("\\relink\n\\define test() Content\n");
});

});
