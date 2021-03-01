/*\

Tests relinking in markdown tiddlers. (text/markdown)

\*/

var utils = require("test/utils");

function test(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var type = options.type || "text/x-markdown";
	options.type = options.fromType; // So we can make from an image
	var failCount = options.fails || 0;
	var wiki = options.wiki;
	var results = utils.relink({text: text, type: type}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
};

describe("markdown text", function() {

it('markdown links', function() {
	var ignore = false, process = true;
	function test(text, expected, report, options) {
		options = Object.assign({from: 'from', to: 'to'}, options);
		const wiki = new $tw.Wiki();
		if (expected === true) {
			expected = text.split(options.from).join(options.to);
		} else if (expected === false) {
			expected = text;
		}
		wiki.addTiddlers([
			{title: 'test', text: text, type: 'text/x-markdown'},
			utils.attrConf('$link', 'to')]);
		expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
		wiki.renameTiddler(options.from, options.to);
		expect(utils.getText('test', wiki)).toBe(expected);
	};
	spyOn(console, 'log');
	test("click [here](#from) for link", process, ['[here](#)']);
	test("click [here](from) for link", ignore);
	test("click [here](# from) for link", ignore);
	test("click [here](#from)\n\nfor link", process, ['[here](#)']);
	test("click [here](#from) or [there](#from) for link", process, ['[here](#)', '[there](#)']);
	// can be only text in string
	test("[here](#from)", process, ['[here](#)']);
	// Don't overlook that open paren
	test("click [here] #from) for link", ignore);
	// Sets parser pos correctly
	test("[here](#from)<$text text={{from}} />", process, ['[here](#)', '<$text text={{}} />']);
	// Bad pattern doesn't mess up pos
	test("[here](#from<$link to='from here'/>", process, ['<$link to />'], {from: 'from here'});
	// later parens don't cause problems
	test("[here](#from) content)", process, ['[here](#)']);
	// The space inside it flags it as not a markdown link
	test("[here](#<$link to='from here'/>)", process, ['<$link to />'], {from: 'from here'});
});

it('markdown images', function() {
	var ignore = false, process = true;
	function test(text, expected, report, options) {
		options = Object.assign({from: 'from.png', to: 'to.png'}, options);
		const wiki = new $tw.Wiki();
		if (expected === true) {
			expected = text.split(options.from).join(options.to);
		} else if (expected === false) {
			expected = text;
		}
		wiki.addTiddler({title: 'test', text: text, type: 'text/x-markdown'});
		expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
		wiki.renameTiddler(options.from, options.to);
		expect(utils.getText('test', wiki)).toBe(expected);
	};
	spyOn(console, 'log');
	test("Image: ![caption](from.png)", process, ['![caption]()']);
	test("Image: ![caption](#from.png)", ignore);
	// tooltips
	test("Image: ![caption](from.png 'tooltip')", process, ['![caption]()']);
	test("Image: ![caption](from.png 'bob\\'s tooltip')", process, ['![caption]()']);
	test("![c](from%20here 'tooltip')", "![c](to%20there 'tooltip')", ['![c]()'], {from: 'from here', to: 'to there'});
	// whitespace
	test("Image: ![caption](  from.png  )", process, ['![caption]()']);
	test("Image: ![caption](\nfrom.png\n)", process, ['![caption]()']);
	test("Image: ![caption](\nfrom.png\n)", process, ['![caption]()']);
	// can be first and last thing in body
	test("![caption](from.png)", process, ['![caption]()']);
	test("![c](from.png)![c](from.png)", process, ['![c]()', '![c]()']);
});

it('links with tricky characters', function() {
	// Must be escaped: %()
	// Safe to escape: ^[]

	var theBeast = "!@#$%^&*() {}|:\"<>?-=[]\\;',./`~¡™£¢∞§¶•ªº–≠“‘«…æ≤≥÷œ∑®´´†\¨ˆøπ˙∆˚¬åß∂ƒ©Ω≈ç√∫˜µ";
	var wiki = new $tw.Wiki();
	var results = utils.relink({text: "[Caption](#from)", type: "text/x-markdown"}, {from: "from", to: theBeast, target: "test", wiki: wiki});
	// I don't care what the raw text looks like. I want to know that the link points to the right place.
	var parser = wiki.parseTiddler("test");
	var node = parser.tree[0];
	while (node.type !== 'link') {
		node = node.children[0];
	}
	expect(node.attributes.to.value).toEqual(theBeast);
	// Now, can I rename away from that monster link?
	test(results.tiddler.fields.text, "[Caption](#to)", {wiki: wiki, from: theBeast, to: "to"});
});

it('links with #', function() {
	test("[c](#%23pound)", "[c](#to%20there)", {from: "#pound"});
	test("[c](#pound)", {from: "#pound", ignored: true});
	// CONFLICT: This is a conflict with ansel's plugin. It needs {#%23pound),
	// but tiddlywiki/markdown doesn't handle that.
	test("[c](#from)", "[c](##pound)", {from: "from", to: "#pound"});
});

it('markdown with tooltips', function() {
	test("click [here](#from 'this tooltip')", {from: "from", to: "to"});
	test("click [here](#from 'this \\'tooltip\\'')", {from: "from", to: "to"});
	test("click [here](#from 't(((ooltip')", {from: "from", to: "to"});
	test("click [here](#from 't)))ooltip')", {from: "from", to: "to"});
	test("click [here](#from 'tooltip\\\\\\\\')", {from: "from", to: "to"});
	test("click [here](#from 'tooltip\\\\\\')", {from: "from", ignored: true});
	test("click [here](#from '')", {from: "from", to: "to"});

	test('click [here](#from "this tooltip")', {from: "from", to: "to"});
	test('click [here](#from "this \\"tooltip\\"")', {from: "from", to: "to"});
	test('click [here](#from "tooltip\\\\\\\\")', {from: "from", to: "to"});
	test('click [here](#from "tooltip\\\\\\")', {from: "from", ignored: true});
	test('click [here](#from "t(((ooltip")', {from: "from", to: "to"});
	test('click [here](#from "t)))ooltip")', {from: "from", to: "to"});
	test('click [here](#from "")', {from: "from", to: "to"});

	test('click [here](#from (this tooltip))', {from: "from", to: "to"});
	test('click [here](#from ("quotes\'))', {from: "from", to: "to"});
	test('click [here](#from (this((((tooltip))', {from: "from", to: "to"});
	test('click [here](#from (this )tooltip))', {from: "from", ignored: true});
	test('click [here](#from ())', {from: "from", to: "to"});

	test('click [here](\n#from   \n"this\ntooltip"\n)', {from: "from", to: "to"});
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
	test("[c](#from)", "[c](#to(%28there)%29)",{from:"from", to:"to((there))"});
	test("[c](#from)", "[c](#to(%28th)(ere)%29)",{from:"from", to:"to((th)(ere))"});
	// Ansel's supports this, but tw/markdown doesn't
	//test("[caption](#from(((here))))", {from: "from(((here)))", to: "(((to)))ther"});
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

it('identifying markdown links with mixed escaping', function() {
	function finds(title, escaped) {
		test("[c](#"+escaped+")", "[c](#there)", {from: title, to: "there"});
	};
	// unnecessarily escaped parenthesis
	finds("(from)here", "%28from%29here");
	finds("a&b;c=d", "a&b;c=d");
	finds("a&b;c=d", "a%26b;c%3Dd");
	finds("path/to/file.com", "path/to%2Ffile.com");
	finds("from", "fr%6Fm");
	finds("from", "fr%6fm");
	finds("100%", "100%25");
	finds("%25", "%2525");
});

it('gracefully handles malformed links', function() {
	test("[caption](#from%)", {from: "from%", ignored: true});
	test("[<$link to='from here'/>](#bad%)");
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
	var ignore = true, process = false;
	function test(text, ignore, report) {
		const wiki = new $tw.Wiki();
		const expected = ignore ? text : text.replace('from', 'to');
		wiki.addTiddler({title: 'test', text: text, type: 'text/x-markdown'});
		expect(utils.getReport('test', wiki).from).toEqual(report);
		wiki.renameTiddler('from', 'to');
		expect(utils.getText('test', wiki)).toBe(expected);
	};
	spyOn(console, 'log');
	// CONFLICT: empty (this does default on tiddlywiki/markdown,
	// and is hidden on anstosa/tw5-markdown
	test("[](#from)", process, ['[](#)']);
	test("[caption](#from)", process, ['[caption](#)']);
	test("[\n](#from)", process, ['[ ](#)']);
	test("[\n\n](#from)", ignore);
	// brackets
	test("[mis]matched](#from)", ignore);
	test("[not[mis]matched](#from)", process, ['[not[mis]matched](#)']);

	// whitespace
	test("[a\nb\nc\nd](#from)", process, ['[a b c d](#)']);
	// Tabs are bad too. They mess up console logging.
	test("[ab\t\tcd](#from)", process, ['[ab cd](#)']);
	test("[a\nb\n\nd](#from)", ignore);
	test("[ab\n    \ncd](#from)", ignore);
	test("[a\nb[\nc]\nd](#from)", process, ['[a b[ c] d](#)']);

	// fakeout on when link starts
	test("[a[](# dud)](#from)", process, ['[a[](# dud)](#)']);
	test("[[[[[[[ [a](#from)", process, ['[a](#)']);
	test("[brackets] [a](#from)", process, ['[a](#)']);

	// Too long or multiline captions are fixed up (15 char max)
	test("[Long\nmulti\nline\ncaption](#from)", process, ["[Long multi line...](#)"]);
	test("[Long\r\nmulti\r\nline\r\ncaption](#from)", process, ["[Long multi line...](#)"]);
});

it("changing captions", function() {
	test("[caption[inner](#from)](#from)", {from: "from", to: "to"});
	test("[<$link to='from' />](#from)", {from: "from", to: "to"});
	test("[{{from}}](#other)", {from: "from", to: "to[there]"});
	test("[[]{{from}}](#from)", {from: "from", to: "to"});
	// encoded link is left alone when caption changes
	test("[{{from}}](#a%26b%3Bc%3Dd)", {from: "from", to: "to"});
	// Even if we don't handle this link, we need to handle the caption
	test("[{{from here}}](nontiddlerlink)");
	// But never with images for some reason
	test("![{{from here}}](nontiddlerlink)", {ignored: true});
	test("![{{from here}}](#otherlink)", {ignored: true});
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
	function parseAndWiki(input, relinked, wikitext, markdown) {
		test(input, relinked, {from: "from", type: "text/vnd.tiddlywiki"});
		var output, wiki = new $tw.Wiki();
		output = wiki.renderText("text/plain", "text/vnd.tiddlywiki", input);
		expect(output).toEqual(wikitext);
		output = wiki.renderText("text/plain", "text/x-markdown", input);
		expect(output).toEqual(markdown);
	};
	parseAndWiki("[Caption](#from) [[from]]", "[Caption](#from) [[to there]]",
	             "[Caption](#from) from", "Caption [[from]]");
	// the codeblock rule
	parseAndWiki("    <$link to='from'>C</$link>",
	             "    <$link to='to there'>C</$link>",
	             "C", "<$link to='from'>C</$link>");
	parseAndWiki("T\n \n    <$link to='from'>C</$link>",
	             "T\n \n    <$link to='to there'>C</$link>",
	             "T\n \n    C", "T<$link to='from'>C</$link>");
});

it("footnotes", function() {
	spyOn(console, 'log');
	function test(text, ignore, report) {
		const wiki = new $tw.Wiki();
		const expected = ignore ? text : text.replace('from', 'to');
		wiki.addTiddler({title: 'test', text: text, type: 'text/x-markdown'});
		expect(utils.getReport('test', wiki).from).toEqual(report);
		wiki.renameTiddler('from', 'to');
		expect(utils.getText('test', wiki)).toBe(expected);
	};
	var ignore = true, process = false;
	test("[]:from", ignore);
	test("[]:#from", process, ['[]:']);
	test("[1]:#from", process, ['[1]:']);
	test("[1]: #from", process, ['[1]:']);
	test("[1]:# from", ignore);
	test("[1]:\n#from", process, ['[1]:']);
	test("[1]:\n#from   ", process, ['[1]:']);
	test("[1]:\n\n#from", ignore);
	test("[1]: #from\n\n", process, ['[1]:']);
	test("[1]:\t\t#from\t\t\n", process, ['[1]:']);
	test("[1]:#from\r\n", process, ['[1]:']);
	test("   [1]:#from", process, ['[1]:']);
	test("text\n\n   [1]:#from", process, ['[1]:']);
	test("text[1]\n\n[1]: #from\n", process, ['[1]:']);

	test("[^text]:#from", ignore);

	test("[te]xt]:#from", ignore);
	test("[t\\]ext]:#from", process, ['[t\\]ext]:']);
	test("[t\\\\]ext]:#from", ignore);
	test("[t\\\\\\]ext]:#from", process, ['[t\\\\\\]ext]:']);
	//test("[\\]text]:#from", process);
	test("[te\nxt]:#from", process, ['[te xt]:']);
	test("[te\n\nxt]:#from", ignore);
	test("[te xt]:#from", process, ['[te xt]:']);
	test("[te\n \t\nxt]:#from", ignore);
	test("[te\n d  \nxt]:#from", process, ['[te d xt]:']);
	// This one should be true, but I gave up on perfect parsing.
	//test("text\n[1]:#from", ignore);
	test("text\nd[1]:#from", ignore);
	test("Text[1]\n1.\n[1]: #from", process, ['[1]:']);

	test("[1]: #from%20here", "[1]: #to%20there");
	test("[1\n\n2]: #else\n\n[3]: #from", process, ['[3]:']);

	test("[Long\nmulti\nline\ncaption]: #from", process, ["[Long multi line...]:"]);
	test("[Long\r\nmulti\r\nline\r\ncaption]: #from", process, ["[Long multi line...]:"]);
});

it("footnotes for images", function() {
	test("[1]: from.png", {from: "from.png", to: "to.png", fromType: "image/png"});
	// Still relinks in case someone wants to just link to an image instead of embed it
	test("[1]: #from.png", {from: "from.png", to: "to.png", fromType: "image/png"});
	test("[1]:  from%20here.png", "[1]:  to%20there.png", {from: "from here.png", to: "to there.png", fromType: "image/png"});

	// types
	test("[1]: from.svg", {from: "from.svg", to: "to.svg", fromType: "image/svg+xml"});
	test("[1]: from.jpg", {from: "from.jpg", to: "to.jpg", fromType: "image/jpeg"});
	test("[1]: from.gif", {from: "from.gif", to: "to.gif", fromType: "image/gif"});
	test("[1]: from.ico", {from: "from.ico", to: "to.ico", fromType: "image/x-icon"});
});

/* INCOMPLETE PARSING: I'm skipping these because updating the captions here
 * also means updating the caption occurrences throughout the document,
 * which involves WAY more ability to jump around than the WikiParser gives
 * me.
it("footnote caption", function() {
	var to = "t}}x";
	// Fails because inner wikitext can't change on its own
	test("[<$link to={{from}}/>]:#from", "[<$link to={{from}}/>]:#"+encodeURIComponent(to), {from: "from", to: to, fails: 1});
	test("[<$link to='from' tag={{from}} />]:#else", "[<$link to='"+to+"' tag={{from}} />]:#else", {from: "from", to: to, fails: 1});
});
 */

/* INCOMPLETE PARSING:
it("respects indented code", function() {
	test("[c](#from)", {from: "from", to: "to"});
	test("   [c](#from)", {from: "from", to: "to"});
	test("Text\n[c](#from)", {from: "from", to: "to"});
	test("Text\n    [c](#from)", {from: "from", to: "to"});
	test("Text\n    [c](#from)", {from: "from", to: "to"});
	test("   Text\n    [c](#from)", {from: "from", to: "to"});

	test("\t[c](#from)", {from: "from", ignored: true});
	test(" \t[c](#from)", {from: "from", ignored: true});
	test("    [c](#from)", {from: "from", ignored: true});
	test("      [c](#from)", {from: "from", ignored: true});
	test("    \t[c](#from)", {from: "from", ignored: true});
	test("    [c](#from)\n", {from: "from", ignored: true});
	test("\n    [c](#from)\n", {from: "from", ignored: true});
	test("\tText\n\t[c](#from)", {from: "from", ignored: true});
	test("\r\n    [c](#from)\r\n", {from: "from", ignored: true});
	test("    Text\n    [c](#from)", {from: "from", ignored: true});
	test("Text\n\n    [c](#from)", {from: "from", ignored: true});
	test("Text\n    \n    [c](#from)", {from: "from", ignored: true});

	test("    [c](#from)\n[d](#from)", "    [c](#from)\n[d](#to)", {from: "from", to: "to"});

	// Other rules too
	test("    <$link to='from here'/>", {ignored: true});
	test("Test\n \n    <$link to='from here'/>", {ignored: true});
});
*/

it("code", function() {
	var ignore = {from: "from", ignored: true};
	var process = {from: "from", to: "to"};
	// Inline code
	test("`[c](#from%20here)`", ignore);
	test("``[c](#from%20here)``", ignore);
	test("```[c](#from%20here)```", ignore);
	test("```\n[c](#from%20here)\n```", ignore);
	test("```javascript\n[c](#from%20here)\n```", ignore);
	test("`[c](#from)``[c](#from)``", "`[c](#to)``[c](#from)``", process);

	test("``[c](#from)\n\na``[c](#from)", process);
	test("``[c](#from)\na\n``\n[c](#from)",
	     "``[c](#from)\na\n``\n[c](#to)", process);
	test("T```[c](#from)```[c](#from)", "T```[c](#from)```[c](#to)", process);
	test("T````[c](#from)````[c](#from)", "T````[c](#from)````[c](#to)", process);
	test("T````[c](#from)`````[c](#from)", process);
	test("``````[c](#from)``````", ignore);

	// Block code
	var ignore = {from: "from", ignored: true};
	var process = {from: "from", to: "to"};
	test("```\n\n[c](#from)\n```\n[c](#from)", "```\n\n[c](#from)\n```\n[c](#to)", process);
	test("```\n\n[c](#from)\n```[c](#from)", ignore);
	test("   ```\n\n[c](#from)\n   ```\n[c](#from)",
	     "   ```\n\n[c](#from)\n   ```\n[c](#to)", process);
	test("```\n[c](#from)", ignore);
	test("s```\n[c](#from)", process);

	// Both in weird ways
	test("T```[c](#from)\n```[c](#from)", "T```[c](#to)\n```[c](#from)", process);
	test("T```[c](#from)\n```\n[c](#from)", "T```[c](#to)\n```\n[c](#from)", process);
});

/* INCOMPLETE PARSING:
it("lists", function() {
	var ignore = {from: "from", ignored: true};
	var process = {from: "from", to: "to"};
	test("1. D\n\n      [c](#from)", process);
	test("10000. D\n\n          [c](#from)", process);
	test("* D\n\n     [c](#from)", process);
	test("+ D\n\n     [c](#from)", process);
	test("- D\n\n     [c](#from)", process);
	test("   1. D\n\n         [c](#from)", process);
	test("   1. D\n\n     [c](#from)", ignore);
	test("1.    D\n\n       [c](#from)", process);
	test("1.    D\n\n          [c](#from)", ignore);
	// This list contains block code in this one
	test("1.     D\n\n       [c](#from)", ignore);

	test("1 . D\n\n    [c](#from)", ignore);
	test("*D\n\n    [c](#from)", ignore);
	test("+D\n\n    [c](#from)", ignore);
	test("-D\n\n    [c](#from)", ignore);
	test("1.D\n\n    [c](#from)", ignore);

	// far enough away that it's a new block
	test("1. D\n\n\n    [c](#from)", ignore);
	test("1.\n      D\n\n       [c](#from)", ignore);

	test("Content\n1. D\n\n      [c](#from)", process);
});
*/

it("report links", function() {
	function testMD(text, expected) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: 'test', text: text, type: 'text/x-markdown'},
			utils.attrConf('$link', 'to')]);
		expect(utils.getReport('test', wiki).from).toEqual(expected);
	};
	testMD("[{{from}} <$link to='from' />](#else)", ["[{{}}](#else)", "[<$link to />](#else)"]);
	testMD("[{{from}}](#from)", ["[{{}}](#from)", "[{{from}}](#)"]);
	testMD("[{{from}}](#from 'tooltip')", ["[{{}}](#from)", "[{{from}}](#)"]);
	// Tooltip
	testMD("[cap](#from (tooltip))", ["[cap](#)"]);
});

describe("tiddlywiki/markdown plugin", function() {

var mdParser = require("$:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext.js")["text/x-markdown"];
var pragmaTitle = "$:/config/markdown/renderWikiTextPragma";
var switchTitle = "$:/config/markdown/renderWikiText";
var defaultPragma = $tw.wiki.getTiddlerText(pragmaTitle);

function pragma(text) {
	return {title: pragmaTitle, text: text};
};

function testPragma(text, expected, pragma, switchValue) {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: pragmaTitle, text: pragma});
	if (switchValue !== undefined) {
		wiki.addTiddler({title: switchTitle, text: switchValue});
	}
	wiki.addTiddler({title: 'test', text: text, type: 'text/x-markdown'})
	wiki.renameTiddler('from here', 'to there');
	expect(utils.getText('test', wiki)).toBe(expected);
};

var link = "[[from here]] [Caption](#from%20here)";
var both =  "[[to there]] [Caption](#to%20there)";
var mdonly =  "[[from here]] [Caption](#to%20there)";

it("wikitextPragma", function() {
	spyOn(console, 'log');
	// links are disabled by default in tiddlywiki/markdown
	testPragma(link, mdonly, defaultPragma);
	// Without pragma, or with simple pragma
	testPragma(link, both, undefined);
	testPragma(link, both, "\\rules except html");
	// that "only"s should be ignore
	testPragma(link, both, "\\rules except html only");
	testPragma(link, both, "\\rules onlycrap html");
	testPragma(link, both, "\\rules\nonly html");
	testPragma(link, both, "stuff \\rules only html");
	// This one work actually, because tiddlywiki/markdown
	// strips whitespace before using it.
	testPragma(link, mdonly, " \\rules only html");
});

it("wikitextPragma wikilinks inside markdown links", function() {
	spyOn(console, 'log');
	// wikitext in caption inherits rules
	testPragma("[[[from here]]](#from%20here)", "[[[to there]]](#to%20there)", undefined);
});


it("wikitextPragma with broken 'only's", function() {
	spyOn(console, 'log');
	// if it's an "only" rule, we must be able to tell. So we must support
	// weird syntax of "only" rules.
	testPragma(link, both, "\\rules only prettylink");
	testPragma(link, both, "\\rules\t\t\tonly prettylink");
	testPragma(link, both, "\\rules only prettylink\n\n");
	testPragma(link, mdonly, "\\rules only"); // shuts everything off
});

it("wikitextPragma with multiple pragma", function() {
	spyOn(console, 'log');
	// If some other pragma is included. We can't choke on that.
	testPragma(link, both, "\\rules only prettylink macrodef\n\\define macro() stuff");
	testPragma(link, both, "\\rules only prettylink macrodef\r\n\\define macro() stuff");
	testPragma(link, both, "\\define macro() \\rules only\n\\rules only prettylink");
	testPragma(link, both, "\\define macro() \\rules only\n  \\rules only prettylink");
	testPragma(link, both, "\\rules only prettylink rules\n\\rules only prettylink");
});

it("wikitextPragma doesn't impact nested wikitext", function() {
	const wiki = new $tw.Wiki();
	spyOn(console, 'log');
	wiki.addTiddlers([
		{title: 'test', text: '<$list emptyMessage="[[from]]" />\n[[from]]\n[caption](#from)', type: 'text/x-markdown'},
		pragma('\\rules only html'),
		utils.attrConf('$list', 'emptyMessage', 'wikitext')]);
	expect(utils.getReport('test', wiki)).toEqual({from: ['<$list emptyMessage="[[from]]" />', '[caption](#)']});
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('test', wiki)).toBe('<$list emptyMessage="[[to]]" />\n[[from]]\n[caption](#to)');
});

/* INCOMPLETE PARSING:
it("wikitextPragma and code blocks", function() {
	testPragma("    [c](#from%20here)", "    [c](#from%20here)", defaultPragma);
	testPragma("T\n \n    [c](#from%20here)", "T\n \n    [c](#from%20here)", defaultPragma);
});
*/

it("wikitext switch", function() {
	spyOn(console, 'log');
	testPragma(link, both, undefined);
	testPragma(link, both, undefined, "true");
	testPragma(link, both, undefined, "TRUE");
	testPragma(link, mdonly, undefined, "");
	testPragma(link, mdonly, undefined, "false");
	testPragma(link, mdonly, undefined, "false");
});

it("won't make placeholders with default markdown settings", function() {
	// because default markdown settings prohibit macrodefs at all.
	const wiki = new $tw.Wiki();
	spyOn(console, 'log');
	wiki.addTiddlers([
		{title: pragmaTitle, text: defaultPragma},
		utils.attrConf('$link', 'to'),
		{title: 'test', type: 'text/x-markdown',
		 text: "<$link to='from here' />[C](#from%20here)"}]);
	var failures = utils.collectFailures(function() {
		wiki.renameTiddler('from here', "to 'there\"");
	});
	expect(utils.getText('test', wiki)).toBe("<$link to='from here' />[C](#to%20'there%22)");
	expect(failures.length).toBe(1);
});

});

});
