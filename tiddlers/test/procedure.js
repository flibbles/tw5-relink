/*\

Tests procedures.
E.G.

\procedure macro() ...
\procedure macro()
...
\end

\*/

var utils = require("test/utils");

describe("fnprocdef", function() {

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
	wiki.addTiddlers(utils.setupTiddlers());
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
	expect(utils.failures).toHaveBeenCalledTimes(options.fails || 0);
};

beforeEach(function() {
	spyOn(console, 'log');
	utils.spyFailures(spyOn);
});

/******** PROCEDURE ********/
describe("procedure", function() {

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

it('parameters can be relinked', function() {
	testText("\\procedure proc(A B) content\n\\relink proc A\n<<proc 'from here'>>", true, ['<<proc A>>']);
	testText("\\procedure proc(A B) content\n\\relink proc B\n<<proc 'from here'>>", false, undefined);
});

});

/******** FUNCTION ********/
describe("function", function() {

it('relinks inside definition', function() {
	testText("\\function filt() [tag[from here]]\n\nContent", true, ['\\function filt() [tag[]]']);
	testText("\\function filt()\n[tag[from here]]\n\\end\nContent", true, ['\\function filt() [tag[]]']);
});

it('parameters', function() {
	testText("\\function filt(A B) content\n\\relink filt A\n<<filt 'from here'>>", true, ['<<filt A>>']);
	testText("\\function filt(A B) content\n\\relink filt B\n<<filt 'from here'>>", false, undefined);
	testText("\\function filt(A) content\n\\relink filt A:reference\n<<filt 'from here!!field'>>", true, ['<<filt A: "!!field">>']);
});

});

/******** WIDGET ********/
describe("widget", function() {

it('relinks inside definition', function() {
	testText("\\widget $widg() {{from here}}\n\nContent", true, ['\\widget $widg() {{}}']);
	testText("\\widget $widg()\n{{from here}}\n\\end\nContent", true, ['\\widget $widg() {{}}']);
});

it('parameters in macrocall form', function() {
	testText("\\widget $widg(A B) content\n\\relink $widg A\n<<$widg 'from here'>>", true, ['<<$widg A>>']);
	testText("\\widget $widg(A B) content\n\\relink $widg B\n<<$widg 'from here'>>", false, undefined);
});

});

});
