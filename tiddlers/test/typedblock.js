/*\

Tests typed blocks.

\*/

var utils = require("./utils");

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddlers([
		{title: 'test', text: text},
		utils.operatorConf("title")]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("table", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('text/plain', function() {
	testText('$$$text/plain\n[[from here]]\n$$$\n{{from here}}',
	         '$$$text/plain\n[[from here]]\n$$$\n{{to there}}',
	         ['{{}}']);
	// Defaults to plain
	testText('$$$\n[[from here]]\n$$$\n{{from here}}',
	         '$$$\n[[from here]]\n$$$\n{{to there}}',
	         ['{{}}']);
	// unknown
	testText('$$$text/unknown\n[[from here]]\n$$$\n{{from here}}',
	         '$$$text/unknown\n[[from here]]\n$$$\n{{to there}}',
	         ['{{}}']);
});

it('text/vnd.tiddlywiki', function() {
	testText('$$$text/vnd.tiddlywiki\n{{from here}}\n$$$', true, ['{{}}']);
	testText('Before content\n\n$$$text/vnd.tiddlywiki\n{{from here}}\n$$$\nAfter content', true, ['{{}}']);
	testText('$$$text/vnd.tiddlywiki>text/plain\n{{from here}}\n$$$', true, ['{{}}']);
	testText('$$$text/vnd.tiddlywiki>text/html\n{{from here}}\n$$$', true, ['{{}}']);
	testText('$$$text/vnd.tiddlywiki   >   text/plain\n{{from here}}\n$$$', true, ['{{}}']);
});

it('text/x-markdown', function() {
	testText('$$$text/x-markdown\n\n[L](#from)\n$$$\n<!--[[from]]-->\n{{from}}',
	         '$$$text/x-markdown\n\n[L](#to)\n$$$\n<!--[[from]]-->\n{{to}}',
	         ['[L](#)', '{{}}'], {from: 'from', to: 'to'});

	testText('$$$.md\n\n[L](#from)\n$$$\n<!--[[from]]-->\n{{from}}',
	         '$$$.md\n\n[L](#to)\n$$$\n<!--[[from]]-->\n{{to}}',
	         ['[L](#)', '{{}}'], {from: 'from', to: 'to'});
});

it('text/x-legacy-text', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/plugins/flibbles/relink/language/Warning/OldRelinkTextOperator", text: "<<type>> - //<<keyword>>//"});
	utils.spyWarnings(spyOn);
	testText('$$$text/x-legacy-text\n{{from here}}\n$$$\n{{from here}}',
	         '$$$text/x-legacy-text\n{{from here}}\n$$$\n{{to there}}',
	         ['{{}}'], {wiki: wiki});
	expect(utils.warnings).toHaveBeenCalledTimes(1);
	// Test for those <em></em>, because this should be wikitext, not plaintext
	expect(utils.warnings.calls.first().args[0]).toContain("text/x-legacy-text - <em>text/x-legacy-text</em>");
	utils.warnings.calls.reset();
	testText('$$$text/x-legacy-text\n{{from here}}\n$$$\n{{from here}}',
	         '$$$text/x-legacy-text\n{{from here}}\n$$$\n{{to there}}',
	         ['{{}}'], {wiki: wiki});
	expect(utils.warnings).not.toHaveBeenCalled();
});

it('unclosed', function() {
	testText('{{from here}}\n\n$$$text/plain\n{{from here}}', 
	         '{{to there}}\n\n$$$text/plain\n{{from here}}',
	         ['{{}}']);
	testText('{{from here}}\n\n$$$text/plain\nStuff\n$$$ \n{{from here}}', 
	         '{{to there}}\n\n$$$text/plain\nStuff\n$$$ \n{{from here}}',
	         ['{{}}']);
	testText('{{from here}}\n\n$$$text/plain\nStuff\n $$$\n{{from here}}', 
	         '{{to there}}\n\n$$$text/plain\nStuff\n $$$\n{{from here}}',
	         ['{{}}']);
});

it('broken', function() {
	testText('$$$ text/plain\n{{from here}}\n$$$', true, ['{{}}']);
	testText('$$$text/plain \n{{from here}}\n$$$', true, ['{{}}']);
	testText('$$$text/plain> k d\n{{from here}}\n$$$', true, ['{{}}']);
	testText('$$$text/plain d\n{{from here}}\n$$$', true, ['{{}}']);
});

it('updates old-style relink placeholders', function() {
	testText('Before\n\n$$$text/vnd.tiddlywiki\n\\define relink-1() from here\n\n<<relink-1>>\n$$$\nAfter', true, ['\\define relink-1()']);
});

it('impossible relinks', function() {
	utils.spyFailures(spyOn);
	testText('Before\n\n$$$text/vnd.tiddlywiki\n<$link to={{from here}} />\n$$$\nAfter', false, ['<$link to={{}} />'], {to: 'to!!there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

});
