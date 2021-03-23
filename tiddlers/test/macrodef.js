/*\

Tests macrodefs.
E.G.

\define macro() ...
\define macro()
...
\end

\*/

var utils = require("test/utils");

describe("macrodef", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

it('sequential defs parse', function() {
	testText("\\define macro() [[from here]]\n\\define other() {{from here}}");
	testText("\\define macro() [[from]]\n\\define relink-list-1() from\n", {from: "from", to: "to"});
	testText("\\define macro() [[from]]\n\n\n\\define relink-list-1() from", {from: "from", to: "to"});
	// multiline
	testText("\\define macro()\nText\n\\end\n\\define other()\n[[from here]]\n\\end");
	testText("\\define macro()\nText\n\\end  \n\n\n\\define other()\n[[from here]]\n\\end");
});

it('parameters', function() {
	testText("\\define macro(  field,  here   ) [[from here]]");
	testText("\\define macro(  field:'value',  here   ) [[from here]]");
});

it('whitespace', function() {
	testText("\\define macro() [[from here]]");
	testText("\\define macro() [[from here]]\n");
	testText("\\define macro() [[from here]]\nText");
	testText("\\define macro() [[from here]]\r\nText");
	testText("\\define macro() [[from here]]\r\nText");
	testText("\\define macro()    \t  [[from here]]\n");
	testText("\\define\t\tmacro()    \t  [[from here]]\n");
});

it('isolates its body from following text', function() {
	// Macrodefs isolate their body and process it alone.
	testText("\\define macro() {{{\nfrom}}}", {from: "from", ignored: true});
});

it("doesn't process macros after pragma", function() {
	testText("Text\n\\define macro() {{{\nfrom}}}", {from: "from", to: "to"});
});

it('respects \\rules', function() {
	// That filteredtransclude won't parse if the macro parsed first.
	testText("\\rules except html\n\\define macro() {{{\nfrom}}}", {ignored: true});
	testText("\\rules only macrodef\n\\define macro() {{{\nfrom}}}", {ignored: true});
	// Test that macrodef won't parse when told not to
	testText("\\rules except macrodef\n\\define macro() {{{\nfrom}}}");
	testText("\\rules only html\n\\define macro() {{{\nfrom}}}");
});

it("multiline and whitespace", function() {
	testText("\\define macro()\n[[from here]]\n\\end");
	testText("\\define macro()   \n[[from here]]\n\\end\nText");
	testText("\\define macro()\t\n[[from here]]\n\\end  \nText");
	testText("\\define macro()\r\n[[from here]]\r\n\\end");
});

it("broken macro", function() {
	testText("\\define macro()\nContent\n[[from here]]\n");
});

it("reports", function() {
	function test(text, expected) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: text});
		expect(wiki.getTiddlerRelinkReferences('test')).toEqual(expected);
	};
	test("\\define macro() from\n", {});
	test("\\define macro()  \n\n[[A]]\n\\end  \n[[B]]", {A: ["\\define macro() [[A]]"], B: ["[[B]]"]});
	test("\\rules except macrodef\n\\define macro() [[A]]\n", {A: ['[[A]]']});
	test("\\define\t\tmacro()    \t  [[T]]\n", {T: ['\\define macro() [[T]]']});
});

});
