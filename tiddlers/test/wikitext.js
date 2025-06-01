/*\

Tests the new relinking wiki methods.

\*/

var utils = require("./utils");
var wikitextUtils = require('$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/utils.js');

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	utils.failures.calls.reset();
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(utils.failures).toHaveBeenCalledTimes(failCount);
	return results;
};

function testReport(text, expected) {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: text});
	var refs = utils.getReport('test', wiki);
	expect(refs).toEqual(expected);
};

describe("wikitext", function() {

beforeEach(function() {
	spyOn(console, 'log');
	utils.spyFailures(spyOn);
});

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
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(results.tiddler.fields.text).toEqual("{{to ]] here}}");
	expect(results.tiddler.fields.list).toEqual(["from here"]);
});

it('comments', function() {
	testText("<!--[[from here]]-->", {ignored: true});
	testText("<!--\n\n[[from here]]\n\n-->", {ignored: true});
	testReport("<!--\n\n[[from here]]\n\n-->", {});

	var inline = "Inline <!-- [[from here]] --> inline";
	var block = "<!--\n\n[[from here]]\n\n-->";
	testText("\\rules except commentinline\n"+inline);
	testText("\\rules except commentblock\n"+inline, {ignored: true});
	testText("\\rules except commentinline\n"+block, {ignored: true});
	testText("\\rules except commentblock\n"+block, {ignored: true});
	testText("\\rules except commentinline commentblock\n"+block);
});

it('code blocks', function() {
	function test(code, ignored) {
		var preamble = "This is a lot of text that comes before the code block to make sure it properly sets the parser.pos past all this."
		var expected = ignored ? "[[VarName]]" : "[[to there]]";
		testText(preamble+code+"[[VarName]]", preamble+code+expected, {from: "VarName"});
	}
	test("\n```\nThis VarName shouldn't update.\n```\n", true);
	test("\n\n```\nThis VarName shouldn't update.\n```\n");
	test("\n```javascript\nThis VarName shouldn't update.\n```\n", true);
	test("\n\n```javascript\nThis VarName shouldn't update.\n```\n");
	test("\n\n```\nFakeout```\n[[content]]\n```\n");
	test(" ``This VarName shouldn't update.``");
	test(" ```This VarName shouldn't update.```", true);
	test("``This VarName shouldn't update.``");
	test(" `This VarName shouldn't update.`");
	test("`This VarName shouldn't update.`");
	// Unclosed codeblocks
	test("\n```\nThis VarName shouldn't update.\n", true);
	test("``This VarName shouldn't update.\n", true);
	test("`This VarName shouldn't update.\n", true);
	testReport("\n`[[no]]` [[yes]]", {yes: ["[[yes]]"]});
	testReport("```\nFakeout```\n[[link]]\n```\n[[yes]]", {yes: ["[[yes]]"]});
});

it('field', function() {
	function test(text, options) {
		var expected;
		[text, expected, options] = utils.prepArgs(text, options);
		options.wiki.addTiddler(utils.fieldConf("field", "wikitext"));
		utils.failures.calls.reset();
		var results = utils.relink({field: text}, options);
		expect(results.tiddler.fields.field).toEqual(expected);
		expect(utils.failures).not.toHaveBeenCalled();
	};
	test("This text has nothing to replace");
	test("A [[from here]] link");

	// Now test that it has proper access to global macros
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("test", "field"),
		{title: "macros", tags: "$:/tags/Macro", text: "\\define test(field) $field$\n"}
	]);
	test("Macro <<test 'from here'>>.", {wiki: wiki});
});

/** This tests that given pieces of wikitext will fail if they're executed
 *  in a wikitext field other than 'text'. Maybe these tests aren't needed??
 */
it('failures in non-text fields', function() {
	function fails(text, expected, options) {
		[text, expected, options] = utils.prepArgs(text, expected, options);
		utils.failures.calls.reset();
		options.wiki.addTiddler(utils.fieldConf("field", "wikitext"));
		var results = utils.relink({field: text}, options);
		// TAKE NOTE: DEFAULT IS 1 FAILURE
		var fails = (options.fails === undefined)? 1 : options.fails;
		expect(results.tiddler.fields.field).toEqual(expected);
		expect(utils.failures).toHaveBeenCalledTimes(fails);
	};
	// html
	fails("A <$link to='from here' /> link", {ignored: true, to: "]] ```'\""});
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("$test", "wiki", "wikitext"));
	fails('A <$test wiki="A {{from here}} B" />',
	      {ignored: true, to: '\' ]]```"""', wiki: wiki});
	fails('A <$test wiki="A {{from here}} B" />',
	      {ignored: true, to: '\' ]]}}```"""', wiki: wiki});
	// Transclude
	fails("A {{from here}}", {ignored: true, to: "A}}B ```]]'\""});
	fails("A {{X||from here}}", {ignored: true, to: "A}}B ```]]'\""});
	fails("A {{A]]'```\"||from here}}", {ignored: true, to: "A}}B"});
	fails("A {{A!!in'```dex\"||from here}}", {ignored: true, to: "A}}B"});
	fails("A {{from here!!in'```dex\"||from here}}", {ignored: true, to: "A}}U"});
	// Macrocalls
	wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("test", "t"));
	wiki.addTiddler(utils.macroConf("test", "wiki", "wikitext"));
	fails("<<test t:'from here'>>", {ignored: true, to: "'A ```]]B\"", wiki: wiki});
	fails("<<test wiki:[[ <$link to='from here' /> ]]>>", {ignored: true, wiki: wiki, to: "']]``` \""});
	// Filters (the filter fails
	fails("{{{[tag[from here]]}}}", {ignored: true, to: "A]G"});
	fails("{{{'from here'}}}", {ignored: true, to: "A']]\""});
	fails("{{{[list[from here]tag[from here]]}}}",
	      "{{{[list[from here]tag[A!!G]]}}}", {to: "A!!G"});
	// Filteredtransclude (the wikipattern fails, not the filter
	fails("{{{A ||from here}}}", {ignored: true, to: "'A}}} ``` ]]B\""});
	fails("{{{[tag[from here]] ||from here}}}",
	      "{{{[tag[from here]] ||A]F}}}", {to: "A]F"});
	fails("{{{A |Tooltip ']]```\"||from here}}}", {ignored: true, to: "'A}}}B"});
	// Wikilink
	fails("Link FromHere.", {ignored: true, from: "FromHere", to:"']] ```\""});
	// Prettylinks
	fails("A [[from here]] link", {ignored: true, to: "'A]]B ```\""});
	fails("A [[Caption|from here]] link", {ignored: true, to: "'A]]B ```\""});
	utils.monkeyPatch(wikitextUtils, "shorthandPrettylinksSupported", () => false, function() {
		fails("A [[from here]] link", {ignored: true, to: "A]]B"});
	});
	fails("A [[B'// ```\"\"\"|from here]] link", {ignored: true, to: "to]]there"});
	// Images
	fails("[img[from here]]", {ignored: true, to: "']] ```\""});
	// Tricky case. We should still be able to downgrade images into widgets.
	fails("[img[from here]]", "<$image source=A]]B/>", {fails: 0, to: "A]]B"});
	fails("[img height={{from here!!height}} [from here]]",
	      "[img height={{']] ```\"!!height}} [from here]]",
	      {ignored: true, to: "']] ```\""});
	fails("[img height={{from here!!height}} [from here]]", {ignored: true, to: "']]}} ```\"", fails: 1});
	// Macrodefs
	fails("\\define macro()\n[[from here]]", {fails: 0});
	fails("\\define relink-filter-1() [tag[from here]]\nBody", {ignored: true, to: "A]]R"});
});

});
