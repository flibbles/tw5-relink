/*\

Tests macrodefs.
E.G.

\define macro() ...
\define macro()
...
\end

\*/

var utils = require("./utils");

describe("macrodef", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
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
};

it('sequential defs parse', function() {
	testText("\\define macro() [[from here]]\n\\define other() {{from here}}", true, ['\\define macro() [[from here]]', '\\define other() {{}}']);
	testText("\\define macro() [[from]]\n\\define relink-list-1() from\n", true, ['\\define macro() [[from]]', '\\define relink-list-1()'], {from: "from", to: "to"});
	testText("\\define macro() [[from]]\n\n\n\\define relink-list-1() from", true, ['\\define macro() [[from]]', '\\define relink-list-1()'], {from: "from", to: "to"});
	// multiline
	testText("\\define macro()\nText\n\\end\n\\define other()\n[[from here]]\n\\end", true, ['\\define other() [[from here]]']);
	testText("\\define macro()\nText\n\\end  \n\n\n\\define other()\n[[from here]]\n\\end", true, ['\\define other() [[from here]]']);
});

it('parameters', function() {
	testText("\\define macro(  field,  here   ) [[from here]]", true, ['\\define macro() [[from here]]']);
	testText("\\define macro(  field:'value',  here   ) [[from here]]", true, ['\\define macro() [[from here]]']);
});

it("sets up placeholder context for body", function() {
	testText('\\define macro(abc) {{$A$}}', true, ['\\define macro() {{}}'], {from: '$A$'});
	testText('\\define macro(abc def) {{$abc$}}', false, undefined, {from: '$abc$'});
	testText('\\define macro(abc def) {{title$abc$}}', false, undefined, {from: 'title$abc$'});
	testText('\\define macro() {{$(any)$}}', false, undefined, {from: '$(any)$'});
	// These global placeholders don't parse, so they aren't placeholders
	testText('\\define macro() {{$(a$ny)$}}', true, ['\\define macro() {{}}'], {from: '$(a$ny)$'});
	testText('\\define macro() {{$(a)ny)$}}', true, ['\\define macro() {{}}'], {from: '$(a)ny)$'});
	testText('\\define macro() {{$()$}}', true, ['\\define macro() {{}}'], {from: '$()$'});
	// Outside of the macrodef, substition is not considered
	testText('\\define macro(abc def) Content\n{{$abc$}}', true, ['{{}}'], {from: '$abc$'});
	testText('\\define macro() Content\n{{$(any)$}}', true, ['{{}}'], {from: '$(any)$'});
	// Placeholder contexts can nest
	testText('\\define macro(abc)\n\\define inner() {{$abc$}}\n\\end', false, undefined, {from: '$abc$'});
});

it('whitespace for single line', function() {
	var report = ['\\define macro() [[from here]]'];
	testText("\\define macro() [[from here]]", true, report);
	testText("\\define macro(    ) [[from here]]", true, report);
	testText("\\define macro(\n) [[from here]]", true, report);
	testText("\\define macro() [[from here]]\n", true, report);
	testText("\\define macro() [[from here]]\nText", true, report);
	testText("\\define macro() [[from here]]\r\nText", true, report);
	testText("\\define macro() [[from here]]\r\nText", true, report);
	testText("\\define macro()    \t  [[from here]]\n", true, report);
	testText("\\define\t\tmacro()    \t  [[from here]]\n", true, report);
	testText("\\define\n\nmacro() [[from here]]\n", true, report);
});

it('whitespace for multi line', function() {
	var report = ['\\define macro() [[from here]]'];
	testText("\\define macro()  \r\n[[from here]]\r\n\\end\nContent", true, report);
	testText("\\define macro()   \n[[from here]]\n\\end\nContent", true, report);
	testText("\\define macro(   )\n[[from here]]\n\\end", true, report);
	testText("\\define\n\nmacro()\n[[from here]]\n\n\\end", true, report);
	testText("\t\\define macro()   \n[[from here]]\n\t\\end", true, report);
	testText("\\whitespace trim\n\t\\define macro()   \n[[from here]]\n\t\\end", true, report);
});

it('isolates its body from following text', function() {
	// Macrodefs isolate their body and process it alone.
	testText("\\define macro() {{{\nfrom}}}", false, undefined, {from: "from"});
});

it("doesn't process macros after pragma", function() {
	testText("Text\n\\define macro() {{{\nfrom}}}", true, ['{{{}}}'], {from: "from", to: "to"});
});

it('respects \\rules', function() {
	var options = {from: "from", to: "to"};
	// That filteredtransclude won't parse if the macro parsed first.
	testText("\\rules except html\n\\define macro() {{{\nfrom}}}", false, undefined, options);
	testText("\\rules only macrodef\n\\define macro() {{{\nfrom}}}", false, undefined, options);
	// Test that macrodef won't parse when told not to
	testText("\\rules except macrodef\n\\define macro() {{{\nfrom}}}", true, ['{{{}}}'], options);
	testText("\\rules only filteredtranscludeinline\n\\define macro() {{{\nfrom}}}", true, ['{{{}}}'], options);
});

it("broken macro", function() {
	testText("\\define macro()\nContent\n[[from here]]\n", true, ['[[from here]]']);
});

});
