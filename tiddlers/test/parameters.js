/*\

Tests parameters pragma and widget.

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
	wiki.addTiddler({title: 'test', text: text});
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("parameters", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('handles parameters on macros', function() {
	testText("\\define test()\n\\parameters(param)\n<<param>>\n\\end\n\\relink test param\n<<test 'from here'>>", true, ['<<test param>>']);
	testText("\\define test(old)\n\\parameters(param)\n<<param>>\n\\end\n\\relink test param\n<<test val 'from here'>>", true, ['<<test param>>']);
	testText("\\define test()\n<<param>>\n\\end\n\\parameters(param)\n\\relink test param\n<<test 'from here'>>", false);
});

it('handles parameters on procedures', function() {
	testText("\\procedure test()\n\\parameters(param)\n<<param>>\n\\end\n\\relink test param\n<<test 'from here'>>", true, ['<<test param>>']);
	testText("\\procedure test(old)\n\\parameters(param)\n<<param>>\n\\end\n\\relink test param\n<<test val 'from here'>>", true, ['<<test param>>']);
	testText("\\procedure test()\n<<param>>\n\\end\n\\parameters(param)\n\\relink test param\n<<test 'from here'>>", false);
});

it('handles parameters on widgets', function() {
	testText("\\widget $.test()\n\\parameters(param)\n<<param>>\n\\end\n\\relink $.test param\n<<$.test 'from here'>>", true, ['<<$.test param>>']);
	testText("\\widget $.test(old)\n\\parameters(param)\n<<param>>\n\\end\n\\relink $.test param\n<<$.test val 'from here'>>", true, ['<<$.test param>>']);
	testText("\\widget $.test()\n<<param>>\n\\end\n\\parameters(param)\n\\relink $.test param\n<<$.test 'from here'>>", false);
});

it('handles the $parameters widget', function() {
	testText("\\procedure test()\n<$parameters first=1 param=def />\n<<param>>\n\\end\n\\relink test param\n<<test 1 'from here'>>", true, ['<<test param>>']);
	testText("\\procedure test()\n<$parameters $parseMode=mode param=def />\n<<param>>\n\\end\n\\relink test param\n<<test 'from here'>>", true, ['<<test param>>']);
	testText("\\procedure test()\n<$parameters first=1 $$param=def />\n<<$param>>\n\\end\n\\relink test $param\n<<test 1 'from here'>>", true, ['<<test $param>>']);
});

});
