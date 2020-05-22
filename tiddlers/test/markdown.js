/*\

Tests relinking in markdown tiddlers. (text/markdown)

\*/

var utils = require("test/utils");

var pragmaTitle = "$:/config/markdown/renderWikiTextPragma";
var defaultPragma = $tw.wiki.getTiddlerText(pragmaTitle);

function test(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/x-markdown";
	var failCount = options.fails || 0;
	var wiki = options.wiki;
	var pragma = defaultPragma;
	if ($tw.utils.hop(options, "pragma")) {
		pragma = options.pragma;
	}
	wiki.addTiddler({title: pragmaTitle,text: pragma});
	var results = utils.relink({text: text, type: type}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
};

describe("markdown text", function() {

it('markdown links', function() {
	test("click [here](#from) for link", {from: "from", to: "to"});
	test("click [here](#from)\n\nfor link", {from: "from", to: "to"});
	test("click [here](#from) or [there](#from) for link", {from: "from", to: "to"});
	// Don't overlook that open paren
	test("click [here] #from) for link", {from: "from", ignored: true});
	// Sets parser pos correctly
	test("[here](#from)<$text text={{from}} />", {from: "from", to: "to"});
	// Bad pattern doesn't mess up pos
	test("[here](#from<$link to='from here'/>");
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
	test("[\n\n](#from)", {from: "from", ignored: true});
	// brackets
	test("[mis]matched](#from)", {from: "from", ignored: true});
	test("[not[mis]matched](#from)", {from: "from", to: "to"});

	// whitespace
	test("[a\nb\nc\nd](#from)", {from: "from", to: "to"});
	test("[a\nb\n\nd](#from)", {from: "from", ignored: true});
	test("[ab\n    \ncd](#from)", {from: "from", ignored: true});
	test("[a\nb[\nc]\nd](#from)", {from: "from", to: "to"});

	// fakeout on when link starts
	test("[a[](# dud)](#from)", {from: "from", to: "to"});
	test("[[[[[[[ [a](#from)", {from: "from", to: "to"});
	test("[brackets] [a](#from)", {from: "from", to: "to"});
});

it("changing captions", function() {
	test("[caption[inner](#from)](#from)", {from: "from", to: "to"});
	test("[<$link to='from' />](#from)", {from: "from", to: "to"});
	test("[{{from}}](#other)", {from: "from", to: "to[there]"});
	test("[[]{{from}}](#from)", {from: "from", to: "to"});
});

it("impossible caption changes", function() {
	var to = "t}}x";
	// Fails because inner wikitext can't change on its own
	test("[<$link to={{from}}/>](#from)", "[<$link to={{from}}/>](#"+encodeURIComponent(to)+")", {from: "from", to: to, fails: 1});
	test("[<$link to='from' tag={{from}} />](#else)", "[<$link to='"+to+"' tag={{from}} />](#else)", {from: "from", to: to, fails: 1});

	// Fails because caption would be illegal
	test("[{{from}}](#from)", "[{{from}}](#brack%5Bet)", {from: "from", to: "brack[et", fails: 1});
	test("[{{from}}](#from)", "[{{from}}](#brack%5Det)", {from: "from", to: "brack]et", fails: 1});
});

it("doesn't affect relinking or parsing of text/vnd.tiddlywiki", function() {
	var text = "[Caption](#from) [[from]]";
	test(text, "[Caption](#from) [[to there]]", {from: "from", type: "text/vnd.tiddlywiki"});
	var output, wiki = new $tw.Wiki();
	output = wiki.renderText("text/plain", "text/vnd.tiddlywiki", text);
	expect(output).toEqual("[Caption](#from) from");
	output = wiki.renderText("text/plain", "text/x-markdown", text);
	expect(output).toEqual("Caption [[from]]");
});

it("wikitextPragma in tiddlywiki/markdown", function() {
	var link = "[[from here]] [Caption](#from%20here)";
	var both =  "[[to there]] [Caption](#to%20there)";
	var mdonly =  "[[from here]] [Caption](#to%20there)";
	// links are disabled by default in tiddlywiki/markdown
	test(link, mdonly);
	// Without pragma, or with simple pragma
	test(link, both, {pragma: undefined});
	test(link, both, {pragma: "\\rules except html"});
	// that "only"s should be ignored
	test(link, both, {pragma: "\\rules except html only"});
	test(link, both, {pragma: "\\rules onlycrap html"});
	test(link, both, {pragma: "\\rules\nonly html"});
	test(link, both, {pragma: "stuff \\rules only html"});
	// This one work actually, because tiddlywiki/markdown
	// strips whitespace before using it.
	test(link, mdonly, {pragma: " \\rules only html"});

	// wikitext in caption inherits rules
	test("[[[from here]]](#from%20here)", "[[[to there]]](#to%20there)", {pragma: undefined});
	// if it's an "only" rule, we must be able to tell. So we must support
	// weird syntax of "only" rules.
	test(link, both, {pragma: "\\rules only prettylink"});
	test(link, both, {pragma: "\\rules\t\t\tonly prettylink"});
	test(link, both, {pragma: "\\rules only prettylink\n\n"});
	test(link, mdonly, {pragma: "\\rules only"}); // shuts everything off

	// If some other pragma is included. We can't choke on that.
	test(link, both, {pragma: "\\rules only prettylink macrodef\n\\define macro() stuff"});
	test(link, both, {pragma: "\\rules only prettylink macrodef\r\n\\define macro() stuff"});
	test(link, both, {pragma: "\\define macro() \\rules only\n\\rules only prettylink"});
	test(link, both, {pragma: "\\define macro() \\rules only\n  \\rules only prettylink"});
	test(link, both, {pragma: "\\rules only prettylink rules\n\\rules only prettylink"});
});

});
