/*\

Tests conditionals.

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
		utils.operatorConf("title"),
		utils.operatorConf("tag")]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("conditional", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('handles the filter', function() {
	testText('Tests <%if [[from here]]%>Content<%endif%>', true, ['<%if %>']);
	testText('Tests <%if [tag[from here]]%>Content<%endif%>', true, ['<%if [tag[]] %>']);
	testText('Tests <%if [[from here]]%>A<%elseif [[from here]] %>B<%endif%>', true, ['<%if %>', '<%elseif %>']);
	testText('Tests <%if [[from here]]%>A<%elseif [tag[from here]] %>B<%endif%>', true, ['<%if %>', '<%elseif [tag[]] %>']);
	testText('Tests <%if [[from here]]%>A<%elseif [[from here]] %>B<%endif%>', true, ['<%if %>', '<%elseif %>']);
	// Whitespace preservation
	testText('Tests <%if   [[from here]]   %>Content', true, ['<%if %>']);
	testText('Tests <%if\n\n[[from here]]\n\n%>Content', true, ['<%if %>']);
	testText('Tests <%if\n\nA\n[[from here]]\n\n%>Content', true, ['<%if %>']);
	testText('<%if X%>A<%elseif   [[from here]]   %>B', true, ['<%elseif %>']);
	testText('<%if X%>A<%elseif\n\n[[from here]]\n\n%>B', true, ['<%elseif %>']);
});

it('handles bodies', function() {
	testText('Tests <%if A%>Bits {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests <%if A%>Bits {{from here}}End', true, ['{{}}']);
	testText('Tests <%if A%>Bits {{from here}}End<%endif%>Following content', true, ['{{}}']);
	// various amounts of double newlines
	testText('Tests\n\n<%if A%>\n\nBits {{from here}}End\n<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\n\n\nits {{from here}}End\n<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\r\n\r\nits {{from here}}End\n<%endif%>', true, ['{{}}']);
	// Works in elseif
	testText('Tests <%if A%>A<%elseif B%>Bits {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nA<%elseif B%>\n\nBits {{from here}}End\n<%endif%>', true, ['{{}}']);
	// Works in else
	testText('Tests <%if A%>A<%else%>Bits {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nA<%else%>\n\nBits {{from here}}End\n<%endif%>', true, ['{{}}']);
	testText('Tests <%if A%>A<%elseif B%>B<%else%>C {{from here}}End<%endif%>', true, ['{{}}']);
	testText('Tests\n\n<%if A%>\n\nA<%elseif B%>\n\nB\n<%else%>\n\nC {{from here}}End\n<%endif%>', true, ['{{}}']);
	// Two replacements
	testText('Tests\n\n<%if A%>\n\n{{from here}}\n<%else %>\n\n[[from here]]\n<%endif%>', true, ['{{}}', '[[from here]]']);
	testText('Tests\n\n<%if A%>\n\n{{from here}}\n\n[[from here]]\n<%endif%>', true, ['{{}}', '[[from here]]']);
});

it('broken', function() {
	testText('Tests < %if [tag[from here]]%>Content<%endif%>', false);
	testText('Tests <%if [tag[from here]]% >Content', false);
	testText('Tests <%if [[from here]] [[%>]] %>Content<%endif%>', false);
});

it('impossible in bodies', function() {
	utils.spyFailures(spyOn);
	testText('<%if A%>A <$text text={{from here}}/> B<%endif%>', false, ['<$text text={{}} />'], {to: 'to!!there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Failure in block mode
	utils.failures.calls.reset();
	testText('<%if A%>\n\n<$text text={{from here}}/>\n<%endif%>', false, ['<$text text={{}} />'], {to: 'to!!there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Failure in elseif
	utils.failures.calls.reset();
	testText('<%if A%>Content<%elseif B%><$text text={{from here}}/><%endif%>', false, ['<$text text={{}} />'], {to: 'to!!there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Failure in else
	utils.failures.calls.reset();
	testText('<%if A%>Content<%else %><$text text={{from here}}/><%endif%>', false, ['<$text text={{}} />'], {to: 'to!!there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// We can have mixed failure and success
	utils.failures.calls.reset();
	testText('<%if A%>A [[from here]] <$text text={{from here}}/> B<%endif%>',
	         '<%if A%>A [[to!!there]] <$text text={{from here}}/> B<%endif%>',
	         ['[[from here]]', '<$text text={{}} />'], {to: 'to!!there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('impossible in filters', function() {
	utils.spyFailures(spyOn);
	testText('<%if [tag[from here]]%>AB<%endif%>', false, ['<%if [tag[]] %>'], {to: 'to]there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Mixed failures and successes
	utils.failures.calls.reset();
	testText('<%if [[from here]] [tag[from here]]%>AB<%endif%>',
	         '<%if \'to]there\' [tag[from here]]%>AB<%endif%>',
	         ['<%if %>', '<%if [tag[]] %>'], {to: 'to]there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Use of %> is explicitly disallowed in these filters
	utils.failures.calls.reset();
	testText('<%if [[from here]]%>AB<%endif%>', false, ['<%if %>'], {to: 'to%>there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

// Tests for issue #54
it('does not return no-op relink entries when at top level', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'related', text: '<%if [tag[from]] %>Content<%endif%>'},
		{title: 'unrelated', text: '<%if [tag[unrelated]] %>Content<%endif%>'},
		{title: 'from'},
		utils.operatorConf('tag')]);
	var changed = utils.wouldChange(wiki, 'from', 'to');
	expect(changed).toEqual(['related']);
});

});
