/*\

Tests prettylinks.

\*/

var utils = require("test/utils");
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
	const unquotable =  "very' bad]]title\"";
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	// without a caption, we have to go straight to placeholders weird,
	// or we might desync the link with its caption with later name changes.
	testText("Link to [[from here]].",
	         utils.placeholder(1,unquotable) +
	         "Link to <$link to=<<relink-1>>/>.",
	         ['[[from here]]'], {to: unquotable, wiki: wiki});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to '"+unquotable+"' in 'test'");
	testText("Link to [[from here]].", "Link to <$link to=A]]B/>.",
	         ['[[from here]]'], {to: "A]]B", wiki: wiki});
	testText("Link to [[from here]].", "Link to <$link to=A|B/>.",
	         ['[[from here]]'], {to: "A|B", wiki: wiki});
});

it('unpretty, without caption, and pre 5.1.20', function() {
	// without a caption, we have to go straight to placeholders in <5.1.20,
	// It doesn't fill in <$link to="tiddler" /> with the caption of
	// "tiddler". Also, we must placeholder both caption and "to", or else
	// we might desync the link with its caption with later name changes.
	spyOn(wikitextUtils, 'shorthandPrettylinksSupported').and.returnValue(false);
	testText("Link [[from here]].",
			 utils.placeholder(1, "to [bracks]") +
			 "Link <$link to=<<relink-1>>><$text text=<<relink-1>>/></$link>.",
			 ['[[from here]]'], {to: "to [bracks]"});
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
	wraps("back`tick", "<$text text=back`tick/>");
	wraps("Unsafe<$link>", "<$text text='Unsafe<$link>'/>");
	// This one is tricky. That close link will close the widget we must
	// wrap the link in, but on its own, it renders same as plaintext.
	wraps("Unsafe</$link>", "<$text text='Unsafe</$link>'/>");
	// Another possibly tricky one. the <!-- might be inactive without -->
	testText("[[D<!--|from here]] --> C",
	         "<$link to=to]]there><$text text='D<!--'/></$link> --> C",
	         ['[[D<!--]]'], {to: "to]]there"});
});

it('has dangerous and unquotable caption content', function() {
	const caption = 'Misty\'s "{{crabshack}}"';
	const wiki = new $tw.Wiki();
	const expected = utils.placeholder("plaintext-1", caption)+"<$link to=to]]there><$text text=<<relink-plaintext-1>>/></$link>";
	wiki.addTiddler({title: 'test', text: "[["+caption+"|from here]]"});
	wiki.renameTiddler('from here', 'to]]there');
	expect(utils.getText('test', wiki)).toBe(expected);
	// That caption is plaintext. It shouldn't be alterable.
	wiki.renameTiddler(caption, 'something else');
	expect(utils.getText('test', wiki)).toBe(expected);
	// It's also not treated as wikitext
	wiki.renameTiddler('crabshack', 'clambake');
	expect(utils.getText('test', wiki)).toBe(expected);
});

it('unquotable and unpretty', function() {
	// We also have to go to to placeholders if title doesn't work for
	// prettylinks or widgets.
	var text = "Link to [[caption|from here]].";
	var to = 'Has apost\' [[bracks]] and "quotes"';
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText(text,
	         utils.placeholder(1, to) +
	         "Link to <$link to=<<relink-1>>>caption</$link>.",
	         ['[[caption]]'], {to: to, wiki: wiki});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to '"+to+"' in 'test'");

	// If rules disable macrodef, then don't placeholder
	var fails = utils.collectFailures(function() {
		testText("\\rules except macrodef\n" + text, false, ['[[caption]]'], {to: to, macrodefCanBeDisabled: true, wiki: wiki});
	});
	expect(fails.length).toEqual(1);
	fails = utils.collectFailures(function() {
		testText("\\rules only prettylink html\n" + text, false, ['[[caption]]'], {to: to, macrodefCanBeDisabled: true, wiki: wiki});
	});
	expect(fails.length).toEqual(1);
});

it('unquotable when $link is customized', function() {
	const wiki = new $tw.Wiki();
	const to = 'Has apost\' [[bracks]] and "quotes"';
	wiki.addTiddler(utils.attrConf('$link', 'to', 'reference'));
	testText('[[caption|from here]]',
	         utils.placeholder('reference-1', to) +
	         "<$link to=<<relink-reference-1>>>caption</$link>",
	         ['[[caption]]'], {to: to, wiki: wiki});
});

it('unquotable when $link is not set', function() {
	const to = 'Has apost\' [[bracks]] and "quotes"';
	testText('[[caption|from here]]',
	         utils.placeholder('plaintext-1', to) +
	         "<$link to=<<relink-plaintext-1>>>caption</$link>",
	         ['[[caption]]'], {to: to});
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

	var fails;
	fails = utils.collectFailures(function() {
		testText("\\rules only prettylink\n[[from here]]",
		         false, ['[[from here]]'], {to: "to]] there"});
	});
	expect(fails.length).toEqual(1);
	fails = utils.collectFailures(function() {
		testText("\\rules except html\n[[from here]]",
		         false, ['[[from here]]'], {to: "to]] there"});
	});
	expect(fails.length).toEqual(1);
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


});
