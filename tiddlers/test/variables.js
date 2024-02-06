/*\

Tests procedures.
E.G.

\procedure macro() ...
\procedure macro()
...
\end

\*/

var utils = require("test/utils");

var variablePrefix = "$:/temp/flibbles/relink-variables/";

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from', to: 'to'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddler({title: 'test', text: text});
	wiki.addTiddler({title: 'global', tags: "$:/tags/Global", text: "\\procedure " + options.from + "() content"});
	var prefix = variablePrefix + "global ";
	expect(utils.getReport('test', wiki)[prefix + options.from]).toEqual(report);
	wiki.renameTiddler(prefix + options.from, prefix + options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe('variables', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('$transclude', function() {
	testText("<$transclude $variable=from />", true, ['<$transclude />']);
	// The following don't replace
	testText("<$transclude $variable={{from}} />", false);
	testText("<$transclude $variable={{{from}}} />", false);
	testText("<$transclude />", false);
});

it('operator handles different tiddler texts', function() {
	function test(text, expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'mytest', text: text});
		expect(wiki.filterTiddlers("[[mytest]relink:variables[]]")).toEqual(expected);
	};
	test("\\define myA() Content\n\\procedure myB()\nContent\n\\end", ['myA', 'myB']);
	test("\\define outer()\n\\define inner()\nInner\n\\end inner\n\\end outer\n", ['outer']);
	// Can pick up $set widgets as well
	test("<$set name=A value=stuff>\n\n<$set name=B value=other>\n\nContent\n</$set></$set>", ['A', 'B']);
	test("<$let A=stuff>\n\nContent\n</$let>", []);
	test("<$vars A=stuff>\n\nContent\n</$let>", []);
	test("\\define myA() A\n\\define myB() B\n\\define myA() A\n", ['myA', 'myB', 'myA']);
});

it('operator handles non-tiddler input', function() {
	const wiki = new $tw.Wiki();
	expect(wiki.filterTiddlers("[[no-exist]relink:variables[]]")).toEqual([]);
});

});
