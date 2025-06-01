/*\

Tests prettylinks.

\*/

var utils = require("./utils");
var wikitextUtils = require('$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/utils.js');

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddler({title: 'test', text: text});
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("prettylink", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('prettylinks', function() {
	var r = testText("Link to [[from here]].", true, ['[[from here]]']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
	testText("Link to [[description|from here]].", true, ['[[description]]']);
	testText("Link to [[description |from here]].", true, ['[[description ]]']);
	testText("Link to [[|from here]].", true, ['[[]]']);
	testText("Link to [[|from|here]].", true, ['[[]]'], {from: 'from|here', to: 'to|there'});
	testText("Link to [[description|from here]].", true, ['[[description]]'], {to: "to|there"});
	testText("Link to [[weird]desc|from here]].", true, ['[[weird]desc]]']);
	testText("Link to [[it is from here|from here]].", "Link to [[it is from here|to there]].", ['[[it is from here]]']);
	testText("Link [[new\nline|from here]].", false, undefined);
	testText("Link to [[elsewhere]].", false, undefined);
	testText("Link to [[desc|elsewhere]].", false, undefined);
	testText("Multiple [[from here]] links [[description|from here]].", true, ['[[from here]]', '[[description]]']);
	testText("Link to [[from here]].", true, ['[[from here]]'], {to: "to [bracket] there"});
});

it('unpretty with caption', function() {
	// single bracket on the end can disqualify prettylinks
	testText("Link to [[caption|from here]].",
	         "Link to <$link to='to [bracks]'>caption</$link>.",
	         ['[[caption]]'], {to: "to [bracks]"});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to [bracks]' in 'test'");
	// double brackets in middle can also disqualify prettylinks
	testText("Link to [[caption|from here]].",
	         "Link to <$link to='bracks [[in]] middle'>caption</$link>.",
	         ['[[caption]]'], {to: "bracks [[in]] middle"});
	// empty caption
	testText("Link to [[|from here]].",
	         "Link to <$link to='bracks [[in]] middle'></$link>.",
	         ['[[]]'], {to: "bracks [[in]] middle"});
});

it('unpretty and without caption', function() {
	const unquotable =  "very' ``` bad]]title\"";
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText("Link to [[from here]].", "Link to <$link to=A]]B/>.",
	         ['[[from here]]'], {to: "A]]B", wiki: wiki});
	testText("Link to [[from here]].", "Link to <$link to=A|B/>.",
	         ['[[from here]]'], {to: "A|B", wiki: wiki});
	utils.spyFailures(spyOn);
	testText("Link to [[from here]].", false, ['[[from here]]'], {to: unquotable, wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('unpretty, without caption, and pre 5.1.20', function() {
	// without a caption, we have to fail in <5.1.20,
	// It doesn't fill in <$link to="tiddler" /> with the caption of
	// "tiddler".
	spyOn(wikitextUtils, 'shorthandPrettylinksSupported').and.returnValue(false);
	utils.spyFailures(spyOn);
	testText("Link [[from here]].", false, ['[[from here]]'], {to: "to [bracks]"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('has dangerous caption content', function() {
	function wraps(caption, expected) {
		testText("[["+caption+"|from here]]",
	         "<$link to=to]]there>"+expected+"</$link>",
	         ['[['+caption+']]'], {to: "to]]there"});
	}
	// doesn't require <$text />
	wraps("Unsafe</$list>", "Unsafe</$list>");

	// requires <$text>
	wraps("Unsafe//caption", "<$text text='Unsafe//caption'/>");
	wraps("back`tick", "<$text text='back`tick'/>");
	wraps("Unsafe<$link>", "<$text text='Unsafe<$link>'/>");
	// This one is tricky. That close link will close the widget we must
	// wrap the link in, but on its own, it renders same as plaintext.
	wraps("Unsafe</$link>", "<$text text='Unsafe</$link>'/>");
	// Another possibly tricky one. the <!-- might be inactive without -->
	testText("[[D<!--|from here]] --> C",
	         "<$link to=to]]there><$text text='D<!--'/></$link> --> C",
	         ['[[D<!--]]'], {to: "to]]there"});
});

it('unquotable and unpretty', function() {
	const to = 'Has apost\' ``` [[bracks]] and "quotes"';
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText("Link to [[caption|from here]].", false, ['[[caption]]'], {to: to, wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('unquotable when $link is customized or unset', function() {
	const wiki = new $tw.Wiki();
	const to = 'Has apost\' ``` [[bracks]] and "quotes"';
	wiki.addTiddler(utils.attrConf('$link', 'to', 'reference'));
	utils.spyFailures(spyOn);
	testText('[[caption|from here]]', false, ['[[caption]]'], {to: to, wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText('[[caption|from here]]', false, ['[[caption]]'], {to: to});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('respects rules', function() {
	testText("\\rules except prettylink\nLink to [[from here]].",
	         false, undefined);
	testText("\\rules only prettylink\nLink to [[from here]].",
	         true, ['[[from here]]']);

	testText("\\rules only prettylink html\n[[from here]]",
	         "\\rules only prettylink html\n<$link to='to]] there'/>",
	         ['[[from here]]'], {to: "to]] there"});
	testText("\\rules except macrodef\n[[from here]]",
	         "\\rules except macrodef\n<$link to='to]] there'/>",
	         ['[[from here]]'], {to: "to]] there"});

	utils.spyFailures(spyOn);
	testText("\\rules only prettylink\n[[from here]]",
			 false, ['[[from here]]'], {to: "to]] there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);

	utils.failures.calls.reset();
	testText("\\rules except html\n[[from here]]",
			 false, ['[[from here]]'], {to: "to]] there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("tricky report situations", function() {
	function test(text, expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: text});
		expect(utils.getReport('test', wiki)).toEqual(expected);
	};
	test("[[|from]]", {from: ['[[]]']});
	// external links are not tiddlers. They shouldn't be reported.
	test("[[https://www.google.com]] stuff", {});
	// Not a valid tiddler, but also not a valid prettylink
	test("[[ from ]]", {' from ': ["[[ from ]]"]});
});

it("ignores placeholders", function() {
	testText("\\define macro(B) [[$A$]]", true, ["\\define macro() [[$A$]]"], {from: "$A$"});
	testText("\\define macro(A) [[$A$]]", false, undefined, {from: "$A$"});
	testText("\\define macro(B) [[from here]]", true, ["\\define macro() [[from here]]"], {to: "$A$"});
	utils.spyFailures(spyOn);
	testText("\\define macro(A) [[from here]]", false, ["\\define macro() [[from here]]"], {to: "$A$"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

});
