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
	wiki.addTiddler({title: 'global', tags: "$:/tags/global", text: "\\procedure " + options.from + "() content"});
	var prefix = variablePrefix;
	expect(utils.getReport('test', wiki)[prefix + options.from]).toEqual(report);
	wiki.renameTiddler(prefix + options.from, prefix + options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

fdescribe('variables', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('$transclude', function() {
	testText("<$transclude $variable=from />", true, ['<$transclude />']);
	// The following don't replace
	testText("<$transclude $variable={{from}} />", false);
	testText("<$transclude $variable={{{from}}} />", false);
});

});
