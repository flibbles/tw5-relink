/*\

Tests macrodefs.
E.G.

\define macro() ...
\define macro()
...
\end

\*/

describe("macrodef", function() {

var utils = require("test/utils");

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

it("multiline and whitespace", function() {
	testText("\\define macro()\n[[from here]]\n\\end");
	testText("\\define macro()   \n[[from here]]\n\\end\nText");
	testText("\\define macro()\t\n[[from here]]\n\\end  \nText");
	testText("\\define macro()\r\n[[from here]]\r\n\\end");
});

it("broken macro", function() {
	testText("\\define macro()\nContent\n[[from here]]\n");
});

});
