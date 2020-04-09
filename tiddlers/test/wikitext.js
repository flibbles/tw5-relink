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

it('placeholders', function() {
	var from = 'End\'s with "quotes"';
	var to = 'Another\'"quotes"';
	var content = "Anything goes here";
	var macro = utils.placeholder;
	// placeholders get replaced too
	var r = testText(macro(1,from)+content, {from: from, to: to});
	expect(r.log).toEqual([`Renaming '${from}' to '${to}' in relink-1 definition of tiddler 'test'`]);
	// Works with Windows newlines
	testText(macro(1,from,"\r\n")+content, {from: from, to: to});
	// Works with the filter placeholders
	testText(macro("filter-1","[title[from here]]")+content);
	r = testText(macro("filter-1","[title[from here]]")+content,
	             macro(1,"to[]this")+macro("filter-1","[title<relink-1>]")+content,
	             {to: "to[]this"});
	expect(r.log).toEqual([`%cRenaming 'from here' to 'to[]this' in relink-filter-1 definition of tiddler 'test' %cby creating placeholder macros`]);
	// Works with the list placeholders
	testText(macro("list-1","A [[from here]] B")+content);
	// Works with reference placeholders
	testText(macro("reference-1","from here!!field")+content);
});

it('import pragma', function() {
	function wiki() {
		var w = new $tw.Wiki();
		w.addTiddler(utils.operatorConf("title"));
		return w;
	};
	var r = testText("\\import [title[from here]]\nstuff.",{wiki: wiki()});
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in \\import filter of tiddler 'test'"]);
	testText("\\rules except prettylink\n\\import [[from here]]\nnot prettylink.");
	testText("\\import [[from|here]]\ndon't parse as prettylink.",
	         {from: "from|here"});
	testText("\\import [title[from here]]\n\n\nnewlines.", {wiki: wiki()});
	testText("\\import   [title[from here]]  \nwhitespace.",{wiki: wiki()});
	testText("\\import [[from here]]\r\nwindows return.", {wiki: wiki()});
	testText("\\import from\nsingle to double.",
	         "\\import [[to there]]\nsingle to double.",
	         {from: "from", wiki: wiki()});

	var to = "bad\"\"\'\'[]name";
	r = testText("\\import [[from here]]\nstuff",
	         utils.placeholder(1,to)+"\\import [<relink-1>]\nstuff",
	         {wiki: wiki(), to: to});
	expect(r.log).toEqual(["%cRenaming 'from here' to '"+to+"' in \\import filter of tiddler 'test' %cby creating placeholder macros"]);
});

});
