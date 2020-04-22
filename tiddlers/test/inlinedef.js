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
	testText("<$macrocall $name=global field='from here' />", {wiki: wiki});
});

it('parses strange syntax', function() {
	var wiki = new $tw.Wiki();
	testText("\\relink  test  field : title \n<<test field: 'from here'>>");
	testText("\\relink test field : title \r\n<<test field: 'from here'>>");
	testText("\\relink t$_-s f-_1D: title\n<<t$_-s f-_1D: 'from here'>>");
});

it('parses multiple parameters in one declaration', function() {
	testText("\\relink test filt:filter ref:reference\n<<test ref: 'from here##i' filt: '[tag[from here]]'>>");
});

it("doesn't prevent macros from importing", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "import",
		text: "\\define A() a\n\\relink A a\n\\define B(field) b"});
	var output = wiki.renderText("text/plain", "text/vnd.tiddlywiki", "\\import import\n<<A>>-<<B>>");
	expect(output).toEqual("a-b");
});

it("doesn't register for events too late", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "import", tags: "$:/tags/Macro",
		text: "\\define register(field) a\n\\relink register field"});
	testText("<<register 'from here'>>", {wiki: wiki});
});

it('handles illegal type', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/plugins/flibbles/relink/language/Error/UnrecognizedType", text: "Type: <<type>>"});
	var text = "\\relink test field: illegal \n<<test field: 'from here'>>";
	// Ignores the illegal rule
	testText(text, {wiki: wiki, ignored: true});
	// Renders a warning
	var plain = wiki.renderText("text/plain", "text/vnd.tiddlywiki",text);
	expect(plain).toEqual("Type: illegal");
});

// Somehow, the relink pragma was borfing up currentTiddler at some point
it("doesn't break currentTiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "Outer", text: "{{MyTiddler}}"},
		{title: "MyTiddler", text: "\\relink anything param\n<<currentTiddler>>"}]);
	var text = wiki.renderTiddler("text/plain", "Outer");
	expect(text).toEqual("MyTiddler");
});

it('handles default type of title', function() {
	var wiki = new $tw.Wiki();
	testText("\\relink test field\n<<test field: 'from here'>>");
	testText("\\relink test   field   \n<<test field: 'from here'>>");
	testText("\\relink test other field\n<<test field: 'from here'>>");
	testText("\\relink test other:title field\n<<test field: 'from here'>>");
});

it('can accumulate vertically', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("test", "ref", "reference"),
		{title: "global", text: "\\relink test filt:filter", tags: "$:/tags/Macro"}
	]);
	testText("\\relink test list:list\n<<test ref: 'from here!!F' filt: '[tag[from here]]' list:'[[from here]]'>>",
	         {wiki: wiki});
});

it('can accumulate horizontally', function() {
	testText("\\relink test list:list\n\\relink test field\n<<test list:'[[from here]]' field:'from here'>>");
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

it("linedef macros don't cling to outdated global defs", function() {
	// This test confirms that inlinemacro defs aren't copying and
	// holding onto global defs longer than they should.
	// This could happen if the inline defs had any settings for a macro
	// themselves.
	utils.monkeyPatch($tw.utils, "nextTick", (fn) => fn(), function() {
		var wiki = new $tw.Wiki();
		wiki.eventsTriggered = false;
		wiki.addTiddler(utils.macroConf("test", "field"));
		wiki.eventsTriggered = false;
		wiki.addTiddler({title: "A", text: "\\relink test other", tags: "$:/tags/Macro"});
		testText("<<test field:'from here' other:'from here'>>", {wiki: wiki});
		wiki.eventsTriggered = false;
		wiki.addTiddler(utils.macroConf("test", "field", "reference"));
		testText("<<test field:'from here!!stuff'>>", {wiki: wiki});
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
