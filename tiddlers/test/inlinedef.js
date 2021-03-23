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

beforeEach(function() {
	spyOn(console, 'log');
});

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

it("doesn't pick up inlinedefs not at head of tiddler", function() {
	var defs = "\\relink test ref:reference\nText\n\\relink test field:title\n";
	var input = "<<test ref:'from here!!T' field:'from here'>>";
	var output= "<<test ref:'to there!!T' field:'from here'>>";
	testText(defs + input, defs + output);
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "macros", tags: "$:/tags/Macro", text: defs});
	testText(input, output, {wiki: wiki});
});

it('handles default type of title', function() {
	var wiki = new $tw.Wiki();
	testText("\\relink test field\n<<test field: 'from here'>>");
	testText("\\relink test   field   \n<<test field: 'from here'>>");
	testText("\\relink test other field\n<<test field: 'from here'>>");
	testText("\\relink test other:title field\n<<test field: 'from here'>>");
});

it('handles default type of something else', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/relink/settings/default-type",
		text: "reference"});
	testText("\\relink t f\n<<t f: 'from here!!F'>>", {wiki: wiki});
	wiki.addTiddler({title: "$:/config/flibbles/relink/settings/default-type",
		text: "wikitext"});
	testText("\\relink t f\n<<t f: '[[link|from here]]'>>", {wiki: wiki});
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

it('linedef macros update appropriately', async function() {
	var wiki = new $tw.Wiki();
	// First, force everything to instantiate
	testText("<<test 'from here'>>", {wiki: wiki, ignored: true});

	// Add a macro def and relink declaration,
	// and ensure macros update
	wiki.addTiddler({title: "macro", text: "\\define test(field) $field$\n\\relink test field:title", tags: "$:/tags/Macro"});
	await utils.flush();
	testText("<<test field:'from here'>>", {wiki: wiki});

	// Next we modify an existing macro, and test it.
	wiki.addTiddler({title: "macro", text: "\\define test(field) $field$\n\\relink test field:reference", tags: "$:/tags/Macro"});
	await utils.flush();
	testText("<<test field:'from here!!stuff'>>", {wiki: wiki});

	// Next we remove an existing macro, and ensure it's gone.
	wiki.deleteTiddler("macro");
	await utils.flush();
	testText("<<test field:'from here!!stuff'>>", {ignored: true, wiki: wiki});
});

it("linedef macros don't cling to outdated global defs", async function() {
	// This test confirms that inlinemacro defs aren't copying and
	// holding onto global defs longer than they should.
	// This could happen if the inline defs had any settings for a macro
	// themselves.
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("test", "field"));
	wiki.addTiddler({title: "A", text: "\\relink test other", tags: "$:/tags/Macro"});
	await utils.flush();
	testText("<<test field:'from here' other:'from here'>>", {wiki: wiki});
	wiki.addTiddler(utils.macroConf("test", "field", "reference"));
	await utils.flush();
	testText("<<test field:'from here!!stuff'>>", {wiki: wiki});
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
