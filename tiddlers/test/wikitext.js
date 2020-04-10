/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

describe("wikitext", function() {

it('allows all other unmanaged wikitext rules', function() {
	function fine(text) { testText(text + " [[from here]]"); };
	fine("This is ordinary text");
	fine("This is a WikiLink here");
	fine("This \n*is\n*a\n*list");
	fine("External links: [ext[https://google.com]] and [ext[Tooltip|https://google.com]] here");
	fine("Comments <!-- Look like this -->");
	fine("Block Comments\n\n<!--\n\nLook like this? -->\n\n");
	fine("\\define macro() Single line stuff\n");
	fine("\\define macro()\nMultiline stuff\n\\end\n");
});

it('ignores titles in generic text', function() {
	testText("This is from here to elsewhere", {ignored: true});
});

it('relink ignore plaintext files', function() {
	var wiki = new $tw.Wiki();
	var text = "This is [[from here]] to there.";
	var results = utils.relink({text: text, type: "text/plain"}, {wiki: wiki});
	expect(results.tiddler.fields.text).toEqual(text);
});

it('handles having no rules at all', function() {
	// Had a bug where processing any elements when no attribute
	// rules were present caused a null-reference.
	testText("<div>[[from here]]</div>");
	testText("<div>\n\n[[from here]]\n\n</div>");
});

it('handles managed rules inside unmanaged rules', function() {
	testText("List\n\n* [[from here]]\n* Item\n");
	testText("''[[from here]]''");
});

it('continues on after impossible relink', function() {
	// The list field can't be updated, but the text should be, despite
	// the failure.
	var text = "{{from here}}";
	var results = utils.relink({text: text, list: "[[from here]]"}, {to: "to ]] here"});
	expect(results.fails.length).toEqual(1);
	expect(results.tiddler.fields.text).toEqual("{{to ]] here}}");
	expect(results.tiddler.fields.list).toEqual(["from here"]);
});

it('comments', function() {
	testText("<!--[[from here]]-->", {ignored: true});
	testText("<!--\n\n[[from here]]\n\n-->", {ignored: true});

	var inline = "Inline <!-- [[from here]] --> inline";
	var block = "<!--\n\n[[from here]]\n\n-->";
	// TODO: This commented-out test should work. Unfortunately, it
	// requires the WikiRelinker to process rule categories
	// (inline, block, pragma) separately, and at appropriate times.
	// This would basically require rewriting the WikiParser. The
	// alternative is to get Jeremy to make a few small changes to the
	// WikiParser which would allow its behavior to be more easily
	// modified through inheritance.
	//testText("\\rules except commentinline\n"+inline);
	testText("\\rules except commentblock\n"+inline, {ignored: true});
	testText("\\rules except commentinline\n"+block, {ignored: true});
	testText("\\rules except commentblock\n"+block, {ignored: true});
	testText("\\rules except commentinline commentblock\n"+block);
});

it('code blocks', function() {
	function test(code, ignored) {
		var preamble = "This is a lot of text that comes before the code block to make sure it properly sets the parser.pos past all this."
		var expected = ignored ? "[[VarName]]" : "[[to there]]";
		testText(preamble+code+expected, preamble+code+expected);
	}
	test("\n```\nThis VarName shouldn't update.\n```\n");
	test("\n```javascript\nThis VarName shouldn't update.\n```\n");
	test(" ``This VarName shouldn't update.``");
	test("``This VarName shouldn't update.``");
	test(" `This VarName shouldn't update.`");
	test("`This VarName shouldn't update.`");
	// Unclosed codeblocks
	test("\n```\nThis VarName shouldn't update.\n", true);
	test("``This VarName shouldn't update.\n", true);
	test("`This VarName shouldn't update.\n", true);
});

it('field', function() {
	function test(text, options) {
		var expected;
		[text, expected, options] = utils.prepArgs(text, options);
		options.wiki.addTiddler(utils.fieldConf("field", "wikitext"));
		var results = utils.relink({field: text}, options);
		expect(results.tiddler.fields.field).toEqual(expected);
		expect(results.fails.length).toEqual(0, "Failure detected");
	};
	test("This text has nothing to replace");
	test("A [[from here]] link");
});

/** This tests that given pieces of wikitext will fail if they're executed
 *  in a wikitext field other than 'text'. In other words, it's testing that
 *  code that would otherwise request placeholders can handle it if it's
 *  not allowed.
 */
it('field failures without placeholdering', function() {
	function fails(text, expected, options) {
		[text, expected, options] = utils.prepArgs(text, expected, options);
		options.wiki.addTiddler(utils.fieldConf("field", "wikitext"));
		var results = utils.relink({field: text}, options);
		var fails = (options.fails === undefined)? 1 : options.fails;
		expect(results.tiddler.fields.field).toEqual(expected);
		expect(results.fails.length).toEqual(fails, "Failure detected");
	};
	// html
	fails("A <$link to='from here' /> link", {ignored: true, to: "]] '\""});
	// Transclude
	fails("A {{from here}}", {ignored: true, to: "A}}B ]]'\""});
	fails("A {{X||from here}}", {ignored: true, to: "A}}B ]]'\""});
	fails("A {{A]]'\"||from here}}", {ignored: true, to: "A}}B"});
	fails("A {{A!!in'dex\"||from here}}", {ignored: true, to: "A}}B"});
	fails("A {{from here!!in'dex\"||from here}}", {ignored: true, to: "A}}B"});
	// Macrocalls
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("test", "t"));
	fails("<<test t:'from here'>>", {ignored: true, to: "'A ]]B\"", wiki: wiki});
	// Filteredtransclude (the wikipattern fails, not the filter
	fails("{{{A ||from here}}}", {ignored: true, to: "'A}}} ]]B\""});
	fails("{{{A |Tooltip ']]\"||from here}}}", {ignored: true, to: "'A}}}B"});
	// Wikilink
	fails("Link FromHere.", {ignored: true, from: "FromHere", to:"']] \""});
	// Prettylinks
	fails("A [[from here]] link", {ignored: true, to: "A]]B"});
	fails("A [[Caption|from here]] link", {ignored: true, to: "']] \""});
	// Images
	fails("[img[from here]]", {ignored: true, to: "']] \""});
		// Tricky case. Even though we can't placeholder, we should
		// still be able to downgrade images into widgets.
	fails("[img[from here]]", "<$image source=A]]B/>", {fails: 0, to: "A]]B"});
	fails("[img height={{from here!!height}} [from here]]",
	      "[img height={{']] \"!!height}} [from here]]",
	      {ignored: true, to: "']] \""});
	fails("[img height={{from here!!height}} [from here]]", {ignored: true, to: "']]}} \"", fails: 2});
});

});
