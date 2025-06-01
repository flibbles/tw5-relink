/*\

Tests syslinks, like

	$:/this/tiddler, but not ~$:/this/tiddler.

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
		utils.attrConf('$link', 'to')]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("syslink", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('syslink', function() {
	const report = ['~$:/sys/link'];
	testText("A $:/sys/link please", true, report, {from: "$:/sys/link", to: "$:/to/there"});
	expect(console.log).toHaveBeenCalledWith("Renaming '$:/sys/link' to '$:/to/there' in 'test'");

	testText("A $:/sys/link please", "A [[to there]] please", report, {from: '$:/sys/link', to: 'to there'});
	testText("A $:/sys/link please", "A [[$:/to'there]] please", report, {from: '$:/sys/link', to: "$:/to'there"});
	testText("A $:/sys/link please", "A [[content/$:/to/there]] please", report, {from: '$:/sys/link', to: "content/$:/to/there"});
	testText("A $:/sys/link please", "A [[~$:/to/there]] please", report, {from: '$:/sys/link', to: "~$:/to/there"});
});

it('ignored cases', function() {
	testText("A ~$:/sys/link please", false, undefined, {from: '$:/sys/link'});
	testText("A $:/sys/link please", false, undefined, {from: "~$:/sys/link"});
	testText("A ~$:/sys/link please", false, undefined, {from: "~$:/sys/link"});
	testText("A ~$:/sys/link please", false, undefined, {from: "~WikiLink"});
});

it('rules pragma', function() {
	testText("\\rules except syslink\nA $:/sys/link please", false, undefined, {from: '$:/sys/link'});
});

it('tricky cases', function() {
	utils.spyFailures(spyOn);
	testText("A $:/sys/link please", false, ["~$:/sys/link"],
	         {from: '$:/sys/link', to: "bad' ``` title]]\""});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

});
