/*\

Tests procedures.
E.G.

\procedure macro() ...
\procedure macro()
...
\end

\*/

var utils = require("./utils");

(utils.atLeastVersion('5.3.0')? describe : xdescribe)("fnprocdef", function() {

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

it("does not set up a placeholder context", function() {
	testText('\\procedure macro(abc) {{$abc$}}', true, ['\\procedure macro() {{}}'], {from: '$abc$'});
	testText('\\procedure macro(abc) {{$(currentTiddler)$}}', true, ['\\procedure macro() {{}}'], {from: '$(currentTiddler)$'});
	// Can rename TO placeholders
	testText('\\procedure macro(abc) {{from here}}', true, ['\\procedure macro() {{}}'], {to: '$(currentTiddler)$'});
	testText('\\procedure macro(abc) {{from here}}', true, ['\\procedure macro() {{}}'], {to: '$abc$'});
	//But outer defines can still set up a context
	testText('\\define macro(abc)\n\\define inner() {{$abc$}}\n\\end', false, undefined, {from: '$abc$'});
	testText('\\define macro(abc)\n\\define inner() {{from here}}\n\\end', false, ['\\define macro() \\define inner() {{}}'], {to: '$abc$', fails: 1});
});

it('multiline', function() {
	testText("\\procedure macro()\n[[from here]]\n\\end", true, ["\\procedure macro() [[from here]]"]);
});

it('parameters can be relinked', function() {
	testText("\\procedure proc(A B) content\n\\relink proc A\n<<proc 'from here'>>", true, ['<<proc A>>']);
	testText("\\procedure proc(A B) content\n\\relink proc B\n<<proc 'from here'>>", false, undefined);
});

it('whitespace for single line', function() {
	var report = ['\\procedure macro() [[from here]]'];
	testText("\\procedure macro() [[from here]]", true, report);
	testText("\\procedure macro(    ) [[from here]]", true, report);
	testText("\\procedure macro(\n) [[from here]]", true, report);
	testText("\\procedure macro() [[from here]]\n", true, report);
	testText("\\procedure macro() [[from here]]\nText", true, report);
	testText("\\procedure macro() [[from here]]\r\nText", true, report);
	testText("\\procedure macro() [[from here]]\r\nText", true, report);
	testText("\\procedure macro()    \t  [[from here]]\n", true, report);
	testText("\\procedure\t\tmacro()    \t  [[from here]]\n", true, report);
	testText("\\procedure\n\nmacro() [[from here]]\n", true, report);
});

it('whitespace for multi line', function() {
	var report = ['\\procedure macro() [[from here]]'];
	testText("\\procedure macro()   \n[[from here]]\n\\end", true, report);
	testText("\\procedure macro(   )\n[[from here]]\n\\end", true, report);
	testText("\\procedure\n\nmacro()\n[[from here]]\n\n\\end", true, report);
	testText("\t\\procedure macro()   \n[[from here]]\n\t\\end", true, report);
	testText("\\whitespace trim\n\t\\procedure macro()   \n[[from here]]\n\t\\end", true, report);
});

it('named \\end pragma', function() {
	testText(`
		\\procedure inner()
		\\procedure nested()
		{{from here!!nested}}
		\\end nested
		{{from here!!inner}}
		\\end inner
		{{from here!!outer}}`, true, [
		'\\procedure inner() \\procedure nested() {{!!nested}}',
		'\\procedure inner() {{!!inner}}',
		'{{!!outer}}']);
});

});

/******** FUNCTION ********/
describe("function", function() {

it('relinks inside definition', function() {
	testText("\\function filt() [tag[from here]]\n\nContent", true, ['\\function filt() [tag[]]']);
	testText("\\function filt()\n[tag[from here]]\n\\end\nContent", true, ['\\function filt() [tag[]]']);
});

it('parameters in macrocall form', function() {
	testText("\\function filt(A B) content\n\\relink filt A\n<<filt 'from here'>>", true, ['<<filt A>>']);
	testText("\\function filt(A B) content\n\\relink filt B\n<<filt 'from here'>>", false, undefined);
	testText("\\function filt(A) content\n\\relink filt A:reference\n<<filt 'from here!!field'>>", true, ['<<filt A: "!!field">>']);
});

it('parameters in filter form', function() {
	testText("\\function .test(A) Content\n\\relink .test A:reference\n<$list filter='[.test[from here!!text]]' />", true, ['<$list filter="[.test[!!text]]" />']);
	testText("\\function .test(A) Content\n\\relink .test A:reference\n<$link to={{{ [.test[from here!!text]] }}} />", true, ['<$link to={{{[.test[!!text]]}}} />']);
	testText("\\function .test(A) Content\n\\relink .test A:reference\n{{{ [.test[from here!!text]] }}}", true, ['{{{[.test[!!text]]}}}']);
	testText("\\function .test(A) Content\n\\relink .test A:reference\n\\define macro(B) --$B$--\n\\relink macro B:filter\n <<macro '[.test[from here!!text]]'>>", true, ['<<macro B: "[.test[!!text]]">>']);
	// Different order parameters
	testText("\\function .test(A B) Content\n\\relink .test B\n{{{ [.test[from here],[from here]] }}}",
	         "\\function .test(A B) Content\n\\relink .test B\n{{{ [.test[from here],[to there]] }}}", ['{{{[.test,[]]}}}']);
});

it('does not crash with irregular parameter relink settings', function() {
	testText("\\function .test() Content\n\\relink .test A:reference\n<$list filter='[.test[from here!!text]]' />", false);
	testText("\\function .test(A) Content\n\\relink .test A:reference\n<$list filter='[.test[X],[from here!!text]]' />", false);
	testText("\\function .test(A) Content\n\\relink .test B:reference\n<$list filter='[.test[from here!!text]]' />", false);
	testText("\\function .test(A) Content\n\\relink .wrong A:reference\n<$list filter='[.test[from here!!text]]' />", false);
});

it('parameters in [function[]] form', function() {
	testText("\\function func(A) Content\n\\relink func A\n{{{ [function[func],[from here]] }}}", true, ['{{{[function[func],[]]}}}']);
	testText("\\function test(A) Content\n\\relink test A:reference\n{{{ [function[test],[from here!!text]] }}}", true, ['{{{[function[test],[!!text]]}}}']);
	testText("\\function test(A B) Content\n\\relink test B\n{{{ [function[test],[X],[from here]] }}}", true, ['{{{[function[test],,[]]}}}']);
	// No relink instructions
	testText("\\function test(A) Content\n{{{ [function[test],[from here]] }}}", false);
	// No function definition
	testText("\\relink test A\n{{{ [function[test],[from here]] }}}", false);
	// Not a text-based macro name
	testText("\\function test(A) Content\n\\relink test A\n{{{ [function<test>,[from here]] }}}", false);
	testText("\\function test(A) Content\n\\relink test A\n{{{ [function{test},[from here]] }}}", false);
	testText("\\function test(A) Content\n\\relink test A\n{{{ [function{test},[from here]] }}}", false);
	// Not a function
	testText("\\procedure test(A) Content\n\\relink test A\n{{{ [function[test],[from here]] }}}", false);
	testText("\\widget test(A) Content\n\\relink test A\n{{{ [function[test],[from here]] }}}", false);
	testText("\\define test(A) Content\n\\relink test A\n{{{ [function[test],[from here]] }}}", false);
	testText("\\function test(A) Content\n\\define test(A) Content\n\\relink test A\n{{{ [function[test],[from here]] }}}", false);
	// Not a text-based parameter
	testText("\\function test(A) Content\n\\relink test A\n{{{ [function[test],<from here>] }}}", false);
	testText("\\function test(A) Content\n\\relink test A:list\n{{{ [function[test],{from and this}] }}}", false, undefined, {from: "from", to: "to"});
	// More arguments supplied than defined
	testText("\\function test(A) Content\n\\relink test A\n{{{ [function[test],[X],[from here]] }}}", false);
});

it('parameters in [function[]] are ugly', function() {
	const to = "to]there";
	testText("\\function test(A) Content\n\\relink test A\n{{{ [function[test],[from here]] }}}", false,
	         ['{{{[function[test],[]]}}}'], {to: "to]there", fails: 1});
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

it('local parameters in widget form', function() {
	testText("\\widget $my.widg(A) content\n\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", true, ['<$my.widg A="!!text" />']);
	// no period should not work
	testText("\\widget $mywidg(A) content\n\\relink $mywidg A:reference\n<$mywidg A='from here!!text' />", false);
	// no dollar sign should not work
	testText("\\widget my.widg(A) content\n\\relink my.widg A:reference\n<my.widg A='from here!!text' />", false);
	// no \relink should not work
	testText("\\widget $my.widg(A) content\n<$my.widg A='from here!!text' />", false);
	// no \widget should not work
	testText("\\procedure $my.widg(A) content\n\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", false);
	testText("\\define $my.widg(A) content\n\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", false);
	testText("\\function $my.widg(A) content\n\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", false);
	// no definition at all should not work
	testText("\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", false);
	// overridden should not work
	testText("\\widget $my.widg(A) content\n\\procedure $my.widg(A) content\n\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", false);
	// but overriding something else SHOULD
	testText("\\procedure $my.widg(A) content\n\\widget $my.widg(A) content\n\\relink $my.widg A:reference\n<$my.widg A='from here!!text' />", true, ['<$my.widg A="!!text" />']);
});

it('global parameters in widget form', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({
		title: "global",
		text: "\\widget $my.widg(A) content\n\\relink $my.widg A:reference",
		tags: "$:/tags/Global"});
	testText("<$my.widg A='from here!!text' />", true, ['<$my.widg A="!!text" />'], {wiki: wiki});
});

it('whitelisted attributes in widget form', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.attrConf("$my.widg", "A", "reference"),
		{ title: "global", text: "\\widget $my.widg(A) content", tags: "$:/tags/Global"}]);
	testText("<$my.widg A='from here!!text' />", true, ['<$my.widg A="!!text" />'], {wiki: wiki});
});

it('whitelisted parameters in macrocall form', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("$my.widg", "A", "reference"),
		{ title: "global", text: "\\widget $my.widg(A) content", tags: "$:/tags/Global"}]);
	testText("<<$my.widg A:'from here!!text' >>", true, ['<<$my.widg A: "!!text">>'], {wiki: wiki});
});

});

});
