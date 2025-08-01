/*\

Tests relinking in markdown tiddlers. (text/markdown)

\*/

var utils = require("./utils");

describe("markdown text", function() {

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
		utils.attrConf('$link', 'to'),
		{title: 'test', text: text, type: options.type || 'text/markdown'},
		{title: options.from, type: options.fromType || 'text/vnd.tiddlywiki'}]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to);
	expect(utils.getText('test', wiki)).toBe(expected);
};

beforeEach(function() {
	spyOn(console, 'log');
});

it('markdown links', function() {
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

// Tests issue #55
it('markdown links with weird brackets', function() {
	test("link to [](<#from>)", true, ['[](#)']);
	test("link to [](<   #from>)", true, ['[](#)']);
	test("link to [](<#from   >)", true, ['[](#)']);
	test("link to [](   <   #from>)Content", true, ['[](#)']);
	test("link to [](<#   from>)", false, undefined);
	test("link to [](<#fr)))om>)", true, ['[](#)'], {from: "fr)))om"});
	test("link to [caption](<#from>)", true, ['[caption](#)']);
	test("link to [caption](<#from> 'tooltip')", true, ['[caption](#)']);
	test("link to [](<#from here>)", "link to [](<#to%20there>)", ['[](#)'], {from: "from here", to: "to there"});
});

it('links with the text/x-markdown type', function() {
	test("[Caption](#from)", process, ['[Caption](#)'], {type: 'text/x-markdown'});
});

it('markdown images before revamp', function() {
	const options = {from: 'from.png', to: 'to.png'};
	test("Image: ![caption](from.png)", process, ['![caption]()'], options);
	// tooltips
	test("Image: ![caption](from.png 'tooltip')", process, ['![caption]()'], options);
	test("Image: ![caption](from.png 'bob\\'s tooltip')", process, ['![caption]()'], options);
	test("![c](from 'tooltip')", "![c](#to%20there 'tooltip')", ['![c]()'], {from: 'from', to: 'to there'});
	// Without the '#", escaping entities don't work
	test("![c](from%20here 'tooltip')", ignore, undefined, {from: 'from here'});
	// whitespace
	test("Image: ![caption](  from.png  )", process, ['![caption]()'], options);
	test("Image: ![caption](\nfrom.png\n)", process, ['![caption]()'], options);
	test("Image: ![caption](\nfrom.png\n)", process, ['![caption]()'], options);
	// can be first and last thing in body
	test("![caption](from.png)", process, ['![caption]()'], options);
	test("![c](from.png)![c](from.png)", process, ['![c]()', '![c]()'], options);
});

it('markdown images after markdown 6.2.6 revamp', function() {
	const options = {from: 'from.png', to: 'to.png'};
	test("Image: ![caption](#from.png)", process, ['![caption](#)'], options);
	// tooltips
	test("Image: ![caption](#from.png 'tooltip')", process, ['![caption](#)'], options);
	test("Image: ![caption](#from.png 'bob\\'s tooltip')", process, ['![caption](#)'], options);
	test("![c](#from%20here 'tooltip')", "![c](#to%20there 'tooltip')", ['![c](#)'], {from: 'from here', to: 'to there'});
	// whitespace
	test("Image: ![caption](  #from.png  )", process, ['![caption](#)'], options);
	test("Image: ![caption](\n#from.png\n)", process, ['![caption](#)'], options);
	test("Image: ![caption](\n#from.png\n)", process, ['![caption](#)'], options);
	// can be first and last thing in body
	test("![caption](#from.png)", process, ['![caption](#)'], options);
	test("![c](#from.png)![c](#from.png)", process, ['![c](#)', '![c](#)'], options);
});

it('links with tricky characters', function() {
	// Must be escaped: %()
	// Safe to escape: ^[]

	var theBeast = "!@#$%^&*() {}|:\"<>?-=[]\\;',./`~¡™£¢∞§¶•ªº–≠“‘«…æ≤≥÷œ∑®´´†\¨ˆøπ˙∆˚¬åß∂ƒ©Ω≈ç√∫˜µ";
	const wiki = new $tw.Wiki();
	var results = utils.relink({text: "[Caption](#from)", type: "text/markdown"}, {from: "from", to: theBeast, target: "test", wiki: wiki});
	// I don't care what the raw text looks like. I want to know that the link points to the right place.
	var parser = wiki.parseTiddler("test");
	var node = parser.tree[0];
	while (node.type !== 'link') {
		var i;
		for (i = 0; i < node.children.length; i++) {
			if (node.children[i].type !== "text") {
				break;
			}
		}
		node = node.children[i];
	}
	expect(node.attributes.to.value).toEqual(theBeast);
	// Now, can I rename away from that monster link?
	expect(utils.getReport('test', wiki)).toEqual({[theBeast]: ['[Caption](#)']});
	wiki.renameTiddler(theBeast, 'to');
	expect(utils.getText('test', wiki)).toBe('[Caption](#to)');
});

// For issues #50
it('links and footnotes with escaped parenthesis and backslashes', function() {
	// links
	test("[c](#Some\\(parens\\))", "[c](#to)", ['[c](#)'], {from: 'Some(parens)'});
	test("[c](#Some\\\\extra\\\\(slashes))", "[c](#to)", ['[c](#)'], {from: 'Some\\extra\\(slashes)'});
	test("[c](#EndSlash\\\\)", "[c](#to)", ['[c](#)'], {from: 'EndSlash\\'});
	test("[c](#EndSlash\\\\)", "[c](#to)", ['[c](#)'], {from: 'EndSlash\\'});
	// footnotes
	test("[1]:#Some\\(paren\\)", "[1]:#to", ['[1]:'], {from: 'Some(paren)'});
	test("[1]:#Malformed\\", false, undefined, {from: 'Malformed\\'});
	test("[1]:#Wellformed\\\\", "[1]:#to", ['[1]:'], {from: 'Wellformed\\'});
});

// See issue #45
it('handles UTF characters gracefully', function() {
	test("[c](#from)", true, ['[c](#)'], {to: "文字"});
});

it('links with #', function() {
	test("[c](#%23pound)", "[c](#to%20there)", ['[c](#)'], {from: "#pound", to: 'to there'});
	test("[c](#pound)", ignore, undefined, {from: "#pound"});
	// CONFLICT: This is a conflict with ansel's plugin. It needs {#%23pound),
	// but tiddlywiki/markdown doesn't handle that.
	test("[c](#from)", "[c](##pound)", ['[c](#)'], {from: "from", to: "#pound"});
});

it('markdown with tooltips', function() {
	test("click [here](#from 'this tooltip')", process, ['[here](#)']);
	test("click [here](#from (this tooltip))", process, ['[here](#)']);
	test("click [here](#from 'this \\'tooltip\\'')", process, ['[here](#)']);
	test("click [here](#from 't(((ooltip')", process, ['[here](#)']);
	test("click [here](#from 't)))ooltip')", process, ['[here](#)']);
	test("click [here](#from 'tooltip\\\\\\\\')", process, ['[here](#)']);
	test("click [here](#from 'tooltip\\\\\\')", ignore);
	test("click [here](#from '')", process, ['[here](#)']);

	test('click [here](#from "this tooltip")', process, ['[here](#)']);
	test('click [here](#from "this \\"tooltip\\"")', process, ['[here](#)']);
	test('click [here](#from "tooltip\\\\\\\\")', process, ['[here](#)']);
	test('click [here](#from "tooltip\\\\\\")', ignore);
	test('click [here](#from "t(((ooltip")', process, ['[here](#)']);
	test('click [here](#from "t)))ooltip")', process, ['[here](#)']);
	test('click [here](#from "")', process, ['[here](#)']);

	test('click [here](#from (this tooltip))', process, ['[here](#)']);
	test('click [here](#from ("quotes\'))', process, ['[here](#)']);
	test('click [here](#from (this((((tooltip))', process, ['[here](#)']);
	test('click [here](#from (this )tooltip))', ignore);
	test('click [here](#from ())', process, ['[here](#)']);

	test('click [here](\n#from   \n"this\ntooltip"\n)', process, ['[here](#)']);
});

it('markdown links with spaces', function() {
	test("click [here](#from%20here).", "click [here](#to%20there).", ['[here](#)'], {from: 'from here', to: 'to there'});
	test("[here](#has%20two%20spaces).", "[here](#to%20there).", ['[here](#)'], {from: "has two spaces", to: 'to there'});
	test("click [here](#from).", "click [here](#to%20there).", ['[here](#)'], {to: 'to there'});
	test("click [here](#from%20here).", "click [here](#to).", ['[here](#)'], {from: 'from here'});
	test("click [here](#from here).", ignore, undefined, {from: 'from here'});
	test("[here](#from%2520here).", "[here](#to%2520there).", ['[here](#)'], {from: "from%20here", to: "to%20there"});
});

it('markdown links with parenthesis', function() {
	test("[caption](#with(paren))", process, ['[caption](#)'], {from: "with(paren)"});
	// don't miss parens if they're the first character of a link
	test("[caption](#(paren))", process, ['[caption](#)'], {from: "(paren)"});

	test("[caption](#(from)(here))", process, ['[caption](#)'], {from: "(from)(here)", to: "(to)(there)"});
	test("[caption](#from)", process, ['[caption](#)'], {to: "with(paren)"});
	test("[c](#from)", "[c](#to(%28there)%29)", ['[c](#)'], {to: "to((there))"});
	test("[c](#from)", "[c](#to(%28th)(ere)%29)", ['[c](#)'], {to: "to((th)(ere))"});
	// Ansel's supports this, but tw/markdown doesn't
	//test("[caption](#from(((here))))", true, ['[caption](#)'], {from: "from(((here)))", to: "(((to)))there"});
});

it('markdown links with mismatched parenthesis', function() {
	test("[c](#with(paren)", ignore, undefined, {from: "with(paren"});
	test("[c](#with%28p)", "[c](#there)", ['[c](#)'], {from: "with(p", to: "there"});
	test("[c](#from)", "[c](#with%28paren)", ['[c](#)'], {from: "from", to: "with(paren"});
	// parens at beginning could be missed if indexing is done wrong.
	test("[c](#)paren)", ignore, undefined, {from: ")paren"});
	test("[c](#)paren)", ignore, undefined, {from: "paren"});
	test("[c](#from)", "[c](#a%29b(c)d%28e)", ['[c](#)'], {to: "a)b(c)d(e"});
});

it('identifying markdown links with mixed escaping', function() {
	function finds(title, escaped) {
		test("[c](#"+escaped+")", "[c](#there)", ['[c](#)'], {from: title, to: "there"});
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
	test("[caption](#from%)", ignore, undefined, {from: "from%"});
	test("[<$link to='from here'/>](#bad%)", process, ['[<$link to />](#bad%)'], {from: 'from here', to: 'to there'});
});

it("whitespaces and multiline", function() {
	// Whitespace
	test("[here](   #from)", process, ['[here](#)']);
	test("[here]( \t\n\t  #from)", process, ['[here](#)']);
	test("[here](#from   )", process, ['[here](#)']);
	test("[here](#from \t\n\t  )", process, ['[here](#)']);
	test("[here](\r\n#from\r\n)", process, ['[here](#)']);

	// None parsing
	test("[c](#content\n<$link to='from here'/>\n)", process, ['<$link to />'], {from: 'from here', to: 'to there'});
	test("[c](#{{from}}()\n\n)", process, ['{{}}']);
});

it("tricky captions", function() {
	// CONFLICT: empty (this does default on tiddlywiki/markdown,
	// and is hidden on anstosa/tw5-markdown
	test("[](#from)", process, ['[](#)']);
	test("[caption](#from)", process, ['[caption](#)']);
	test("[\n](#from)", process, ['[](#)']);
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
	test("[caption[inner](#from)](#from)", process, ['[[inner](#)](#from)', '[caption[inner](...](#)']);
	test("[<$link to='from' />](#from 'tooltip')", process, ['[<$link to />](#from)', '[<$link to=\'from...](#)']);
	test("[{{from}}](#other)", process, ['[{{}}](#other)'], {to: "to[there]"});
	test("[{{from}}](#other 'tooltip')", process, ['[{{}}](#other)'], {to: "to[there]"});
	test("[[]{{from}}](#from)", process, ['[{{}}](#from)', '[[]{{from}}](#)']);
	// encoded link is left alone when caption changes
	test("[{{from}}](#a%26b%3Bc%3Dd)", process, ['[{{}}](#a%26b%3Bc%3Dd)']);
	// Even if we don't handle this link, we need to handle the caption
	test("[{{from here}}](nontiddlerlink)", process, ['[{{}}](#nontiddlerlink)'], {from: 'from here'});
	// But never with images for some reason
	test("![{{from here}}](nontiddlerlink)", ignore);
	test("![{{from here}}](#otherlink)", ignore);
});

it("impossible caption changes", function() {
	function testFails() {
		utils.failures.calls.reset();
		test.apply(this, arguments);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	var to = "t}}x";
	utils.spyFailures(spyOn);
	// Fails because inner wikitext can't change on its own
	testFails("[<$link to={{from}}/>](#from)", "[<$link to={{from}}/>](#"+to+")", ['[<$link to={{}} />](#from)', '[<$link to={{fro...](#)'], {from: "from", to: to});
	testFails("[<$link to='from' tag={{from}} />](#else)", "[<$link to='"+to+"' tag={{from}} />](#else)", ['[<$link to />](#else)', '[<$link tag={{}} />](#else)'], {from: "from", to: to});

	// Fails because caption would be illegal
	testFails("[{{from}}](#from)", "[{{from}}](#brack[et)", ['[{{}}](#from)', '[{{from}}](#)'], {from: "from", to: "brack[et"});
	testFails("[{{from}}](#from)", "[{{from}}](#brack]et)", ['[{{}}](#from)', '[{{from}}](#)'], {from: "from", to: "brack]et"});
});

it("doesn't affect relinking or parsing of text/vnd.tiddlywiki", function() {
	function parseAndWiki(input, relinked, report, wikitext, markdown) {
		test(input, relinked, report, {from: "from", to: 'to there', type: "text/vnd.tiddlywiki"});
		var output, wiki = new $tw.Wiki();
		output = wiki.renderText("text/plain", "text/vnd.tiddlywiki", input);
		expect(output).toEqual(wikitext);
		output = wiki.renderText("text/plain", "text/markdown", input);
		expect(output).toEqual(markdown);
	};
	parseAndWiki("[Caption](#from) [[from]]", "[Caption](#from) [[to there]]",
	             ['[[from]]'],
	             "[Caption](#from) from", "\nCaption [[from]]\n\n");
	// the codeblock rule
	parseAndWiki("    <$link to='from'>C</$link>",
	             "    <$link to='to there'>C</$link>",
	             ['<$link to />'],
	             "C", "\n<$link to='from'>C</$link>\n\n");
	parseAndWiki("T\n \n    <$link to='from'>C</$link>",
	             "T\n \n    <$link to='to there'>C</$link>",
	             ['<$link to />'],
	             "T\n \n    C", "\nT\n\n<$link to='from'>C</$link>\n\n");
});

it("footnotes", function() {
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
	test("Text[1]\n1.\n[1]: #from", ignore);
	test("Text[1]\n1.\n\n[1]: #from", process, ['[1]:']);

	test("[1]: #from%20here", "[1]: #to%20there", ['[1]:'], {from: 'from here', to: 'to there'});
	test("[1\n\n2]: #else\n\n[3]: #from", process, ['[3]:']);

	test("[Long\nmulti\nline\ncaption]: #from", process, ["[Long multi line...]:"]);
	test("[Long\r\nmulti\r\nline\r\ncaption]: #from", process, ["[Long multi line...]:"]);
});

it("footnotes for images before v5.2.6 revamp", function() {
	test("[1]: from.png", process, ['[1]:'], {from: "from.png", to: "to.png", fromType: "image/png"});
	test("[1]: from.png", "[1]: #to%20there.png", ['[1]:'], {from: "from.png", to: "to there.png", fromType: "image/png"});
	test("[1]: from%20here.png", ignore, undefined, {from: "from here.png", fromType: "image/png"});
});

it("footnotes for images after v5.2.6 markdown revamp", function() {
	test("[1]: #from.png", process, ['[1]:'], {from: "from.png", to: "to.png", fromType: "image/png"});
	test("[1]:  #from%20here.png", "[1]:  #to%20there.png", ['[1]:'], {from: "from here.png", to: "to there.png", fromType: "image/png"});

	// types
	test("[1]: #from.svg", process, ['[1]:'], {from: "from.svg", to: "to.svg", fromType: "image/svg+xml"});
	test("[1]: #from.jpg", process, ['[1]:'], {from: "from.jpg", to: "to.jpg", fromType: "image/jpeg"});
	test("[1]: #from.gif", process, ['[1]:'], {from: "from.gif", to: "to.gif", fromType: "image/gif"});
	test("[1]: #from.ico", process, ['[1]:'], {from: "from.ico", to: "to.ico", fromType: "image/x-icon"});
});

it('gracefully handles malformed footnotes', function() {
	test("[caption]: #from%", ignore, undefined, {from: "from%"});
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
	// Inline code
	test("`[c](#from%20here)`", ignore);
	test("``[c](#from%20here)``", ignore);
	test("```[c](#from%20here)```", ignore);
	test("```\n[c](#from%20here)\n```", ignore);
	test("```javascript\n[c](#from%20here)\n```", ignore);
	test("`[c](#from)``[c](#from)``", "`[c](#to)``[c](#from)``", ['[c](#)']);

	test("``[c](#from)\n\na``[f](#from)", process, ['[c](#)', '[f](#)']);
	test("``[c](#from)\na\n``\n[c](#from)",
	     "``[c](#from)\na\n``\n[c](#to)", ['[c](#)']);
	test("T```[c](#from)```[c](#from)", "T```[c](#from)```[c](#to)", ['[c](#)']);
	test("T````[c](#from)````[c](#from)", "T````[c](#from)````[c](#to)", ['[c](#)']);
	test("T````[c](#from)`````[c](#from)", process, ['[c](#)', '[c](#)']);
	test("``````[c](#from)``````", ignore);

	// Block code
	test("```\n\n[c](#from)\n```\n[c](#from)", "```\n\n[c](#from)\n```\n[c](#to)", ['[c](#)']);
	test("```\n\n[c](#from)\n```[f](#from)", ignore);
	test("   ```\n\n[c](#from)\n   ```\n[g](#from)",
	     "   ```\n\n[c](#from)\n   ```\n[g](#to)", ['[g](#)']);
	test("```\n[c](#from)", ignore);
	test("s```\n[c](#from)", process, ['[c](#)']);

	// Both in weird ways
	test("T```[c](#from)\n```[h](#from)", "T```[c](#to)\n```[h](#from)", ['[c](#)']);
	test("T```[c](#from)\n```\n[h](#from)", "T```[c](#to)\n```\n[h](#from)", ['[c](#)']);
});

it("macros on multiple lines", function() {
	test("\\define X(l) $l$\n\\relink X l:list\n<<X \"from\">>", process, ['<<X l>>']);
	test("\\define X(l) $l$\n\\relink X l:list\n<<X \"\nfrom\">>",
	     "\\define X(l) $l$\n\\relink X l:list\n<<X \"to\">>",
	['<<X l>>']);
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

describe("tiddlywiki/markdown plugin", function() {

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
	wiki.addTiddler({title: 'test', text: text, type: 'text/markdown'})
	wiki.renameTiddler('from here', 'to there');
	expect(utils.getText('test', wiki)).toBe(expected);
};

var link = "[[from here]] [Caption](#from%20here)";
var both =  "[[to there]] [Caption](#to%20there)";
var mdonly =  "[[from here]] [Caption](#to%20there)";

it("wikitextPragma", function() {
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
	// wikitext in caption inherits rules
	testPragma("[[[from here]]](#from%20here)", "[[[to there]]](#to%20there)", undefined);
});


it("wikitextPragma with broken 'only's", function() {
	// if it's an "only" rule, we must be able to tell. So we must support
	// weird syntax of "only" rules.
	testPragma(link, both, "\\rules only prettylink");
	testPragma(link, both, "\\rules\t\t\tonly prettylink");
	testPragma(link, both, "\\rules only prettylink\n\n");
	testPragma(link, mdonly, "\\rules only"); // shuts everything off
});

it("wikitextPragma with multiple pragma", function() {
	// If some other pragma is included. We can't choke on that.
	testPragma(link, both, "\\rules only prettylink macrodef\n\\define macro() stuff");
	testPragma(link, both, "\\rules only prettylink macrodef\r\n\\define macro() stuff");
	testPragma(link, both, "\\define macro() \\rules only\n\\rules only prettylink");
	testPragma(link, both, "\\define macro() \\rules only\n  \\rules only prettylink");
	testPragma(link, both, "\\rules only prettylink rules\n\\rules only prettylink");
});

it("wikitextPragma doesn't impact nested wikitext", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: '<$list emptyMessage="[[from]]" />\n[[from]]\n[caption](#from)', type: 'text/markdown'},
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
	testPragma(link, both, undefined);
	testPragma(link, both, undefined, "true");
	testPragma(link, both, undefined, "TRUE");
	testPragma(link, mdonly, undefined, "");
	testPragma(link, mdonly, undefined, "false");
	testPragma(link, mdonly, undefined, "false");
});

it("failures in wikitext don't stop markdown relinking", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pragmaTitle, text: defaultPragma},
		utils.attrConf('$link', 'to'),
		{title: 'test', type: 'text/markdown',
		 text: "<$link to='from here' />[C](#from%20here)"}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from here', "to 'there```\"");
	expect(utils.getText('test', wiki)).toBe("<$link to='from here' />[C](#to%20'there```\")");
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

});

});
