/*\

Tests relinking in markdown tiddlers. (text/markdown)

\*/

var utils = require("test/utils");

function test(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/x-markdown";
	var failCount = options.fails || 0;
	var results = utils.relink({text: text, type: type}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
};

describe("markdown text", function() {

it('can still treat markdown like wikitext', function() {
	test("[[from here]]", "[[to there]]");
});

it('markdown links', function() {
	test("click [here](#from) for link", {from: "from", to: "to"});
	test("click [here](#from)\n\nfor link", {from: "from", to: "to"});
	test("click [here](#from) or [there](#from) for link", {from: "from", to: "to"});
	// Sets parser pos correctly
	test("[here](#from)[[from]]", {from: "from", to: "to"});
	// Bad pattern doesn't mess up pos
	test("[here](#from[[from here]]");
	// later parens don't cause problems
	test("[here](#from) content)", {from: "from", to: "to"});
	// The space inside it flags it as not a markdown link
	test("[here](#<$link to='from here'/>)");

});

it('markdown links with spaces', function() {
	test("click [here](#from%20here).", "click [here](#to%20there).");
	test("[here](#has%20two%20spaces).", "[here](#to%20there).", {from: "has two spaces"});
	test("click [here](#from).", "click [here](#to%20there).", {from: "from"});
	test("click [here](#from%20here).", "click [here](#to).", {to: "to"});
	test("click [here](#from here).", {ignored: true});
	test("[here](#from%2520here).", "[here](#to%2520there).", {from: "from%20here", to: "to%20there"});
});

it('markdown links with parenthesis', function() {
	test("[caption](#with(paren))", {from: "with(paren)", to: "there"});
	// don't miss parens if they're the first character of a link
	test("[caption](#(paren))", {from: "(paren)", to: "there"});

	test("[caption](#(from)(here))", {from: "(from)(here)", to: "(to)(there)"});
	test("[caption](#from)", {from: "from", to: "with(paren)"});
	test("[caption](#from(((here))))", {from: "from(((here)))", to: "(((to)))ther"});
});

it('markdown links with mismatched parenthesis', function() {
	test("[c](#with(paren)", {from: "with(paren", ignored: true});
	test("[c](#with%28p)", "[c](#there)", {from: "with(p", to: "there"});
	test("[c](#from)", "[c](#with%28paren)", {from: "from", to: "with(paren"});
	// parens at beginning could be missed if indexing is done wrong.
	test("[c](#)paren)", {from: ")paren", ignored: true});
	test("[c](#)paren)", {from: "paren", ignored: true});
	test("[c](#from)", "[c](#a%29b(c)d%28e)", {from: "from", to: "a)b(c)d(e"});
});

it("whitespaces and multiline", function() {
	// Whitespace
	test("[here](   #from)", {from: "from", to: "to"});
	test("[here]( \t\n\t  #from)", {from: "from", to: "to"});
	test("[here](#from   )", {from: "from", to: "to"});
	test("[here](#from \t\n\t  )", {from: "from", to: "to"});
	test("[here](\r\n#from\r\n)", {from: "from", to: "to"});

	// None parsing
	test("[c](#content\n<$link to='from here'/>\n)");
	test("[c](#{{from}}()\n\n)", {from: "from"});
});

it("tricky captions", function() {
	// empty (this does default on tiddlywiki/markdown,
	// and is hidden on anstosa/tw5-markdown
	test("[](#from)", {from: "from", to: "to"});
	test("[\n](#from)", {from: "from", to: "to"});
	// brackets
	test("[mis]matched](#from)", {from: "from", ignored: true});
	test("[not[mis]matched](#from)", {from: "from", to: "to"});

	// whitespace
	test("[a\nb\nc\nd](#from)", {from: "from", to: "to"});
	test("[a\nb[\nc]\nd](#from)", {from: "from", to: "to"});
});

});
