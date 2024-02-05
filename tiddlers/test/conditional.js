/*\

Tests conditionals.

\*/

var utils = require("test/utils");

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
		utils.operatorConf("title"),
		utils.operatorConf("tag")]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

fdescribe("conditional", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('handles the filter', function() {
	testText('Tests <%if [[from here]]%>Content<%endif%>', true, ['<%if %>']);
	testText('Tests <%if [tag[from here]]%>Content<%endif%>', true, ['<%if [tag[]] %>']);
	testText('Tests <%if [[from here]]%>A<%elseif [[from here]] %>B<%endif%>', true, ['<%if %>', '<%elseif %>']);
	testText('Tests <%if [[from here]]%>A<%elseif [tag[from here]] %>B<%endif%>', true, ['<%if %>', '<%elseif [tag[]] %>']);
});

it('handles bodies', function() {
	testText('Tests <%if A%>Bits {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nBits {{from here}}End\n<%endif%>', true, ['{{}}']);
	testText('Tests <%if A%>A<%elseif B%>Bits {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nA<%elseif B%>\n\nBits {{from here}}End\n<%endif%>', true, ['{{}}']);
	testText('Tests <%if A%>A<%else%>Bits {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nA<%else%>\n\nBits {{from here}}End\n<%endif%>', true, ['{{}}']);
	testText('Tests <%if A%>A<%elseif B%>B<%else%>C {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nA<%elseif B%>\n\nB\n<%else%>\n\nC {{from here}}End\n<%endif%>', true, ['{{}}']);

	testText('Tests <%if [[from here]]%>A<%elseif [[from here]] %>B<%endif%>', true, ['<%if %>', '<%elseif %>']);
});

it('broken', function() {
	testText('Tests < %if [tag[from here]]%>Content<%endif%>', false);
	testText('Tests <%if [tag[from here]]% >Content', false);
	testText('Tests <%if [[from here]] [[%>]] %>Content<%endif%>', false);
});

});
