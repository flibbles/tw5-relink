/*\

Tests quoteblocks.

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

describe("quoteblock", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('works', function() {
	testText("<<<\n[[from here]]\n<<<", true, ['[[from here]]']);
	testText("Text before\n<<<\n[[from here]]\n<<<", true, ['[[from here]]']);
	testText("<<<\n[[a|from here]]\n<<<\n[[b|from here]]", true, ['[[a]]', '[[b]]']);

	testText("<<<<<\n[[from here]]\n<<<<<", true, ['[[from here]]']);
	// Multiple results
	testText("<<<[[a|from here]]\n[[b|from here]]\n<<<", true, ['<<< [[a]]', '[[b]]']);
});

it('citation', function() {
	// Leading citations
	testText("<<<and [[from here]]\nInner\n<<<", true, ['<<< [[from here]]']);
	testText("<<< [[from here]]\nInner text\n<<<", true, ['<<< [[from here]]']);
	testText("<<<.class [[from here]]\nInner\n<<<", true, ['<<< [[from here]]']);
	// Tail citations
	testText("<<<\nInner\n<<< and [[from here]]", true, ['<<< [[from here]]']);
	testText("<<<\nInner\n<<< [[from here]]\n", true, ['<<< [[from here]]']);

	// Extra carrots
	testText("<<<<and [[from here]]\nInner\n<<<<", true, ['<<<< [[from here]]']);
});

it('nested', function() {
	testText("<<<\nText\n<<<<\n[[a|from here]]\n<<<<\ntext\n<<<", true, ['[[a]]']);
	// nested citation
	testText("<<<\nText\n\n<<<< content [[a|from here]]\nContent\n<<<<\ntext\n<<<", true, ['<<<< [[a]]']);
	testText("<<<\nText\n\n<<<<\nContent\n<<<< and [[a|from here]]\ntext\n<<<", true, ['<<<< [[a]]']);
});

it('does not confuse with macrocalls', function() {
	// This was a strange use case I found. block quotes weren't handled, so
	// it would accidentally think it was the start of a macro.
	testText("<<<\nText\n<<<\n\n[[from here]]\n\n<<macro>>\n", true, ['[[from here]]']);
});

it('missing closing syntax', function() {
	testText("<<<\n[[from here]]", true, ['[[from here]]']);
	testText("<<<\n[[from here]]", true, ['[[from here]]']);
});

it('handles errors', function() {
	utils.spyFailures(spyOn);
	testText("<<<\n<$text text={{from here}}/>\n<<<[[from here]]\n[[from here]]",
	         "<<<\n<$text text={{from here}}/>\n<<<[[to!!there]]\n[[to!!there]]",
	         ['<$text text={{}} />', '<<< [[from here]]', '[[from here]]'],
	         {to: "to!!there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText("<<< <$text text={{from here}}/>\n[[from here]]\n<<<",
	         "<<< <$text text={{from here}}/>\n[[to!!there]]\n<<<",
	         ['<<< <$text text={{}} />', '[[from here]]'],
	         {to: "to!!there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText("<<<\n[[from here]]\n<<< <$text text={{from here}}/>\n",
	         "<<<\n[[to!!there]]\n<<< <$text text={{from here}}/>\n",
	         ['[[from here]]', '<<< <$text text={{}} />'],
	         {to: "to!!there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

});
