/*\

Tests procedures.
E.G.

\procedure macro() ...
\procedure macro()
...
\end

\*/

var utils = require("test/utils");

describe("procedure", function() {

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	utils.failures.calls.reset();
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddlers(
		[Object.assign({title: 'test', text: text}, options.fields)]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
	expect(utils.failures).toHaveBeenCalledTimes(options.fails || 0);
};

beforeEach(function() {
	spyOn(console, 'log');
	utils.spyFailures(spyOn);
});

it('sequential procedures parse', function() {
	testText("\\procedure macro() [[from here]]\n\\procedure other() {{from here}}", true, ["\\procedure macro() [[from here]]", "\\procedure other() {{}}"]);
});

it('parameters', function() {
	testText("\\procedure macro(  field,  here   ) [[from here]]", true, ["\\procedure macro() [[from here]]"]);
	testText("\\procedure macro(  field:'value',  here   ) [[from here]]", true, ["\\procedure macro() [[from here]]"]);
});

it('multiline', function() {
	testText("\\procedure macro()\n[[from here]]\n\\end", true, ["\\procedure macro() [[from here]]"]);
});

/*
it('parameters can be relinked', function() {
	testText("\\define proc(A) content\n\\relink proc A\n<<proc 'from here'>>", true, ['<<proc A>>']);
});
*/

});
