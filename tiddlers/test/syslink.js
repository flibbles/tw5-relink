/*\

Tests syslinks, like $:/this/tiddler, but not ~$:/this/tiddler.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options = Object.assign({from: "$:/sys/link"}, options);
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

describe("syslink", function() {

it('syslink', function() {
	var r;
	r = testText("A $:/sys/link please", {from: "$:/sys/link", to: "$:/to/there"});
	expect(r.log).toEqual(["Renaming '$:/sys/link' to '$:/to/there' in syslink of tiddler 'test'"]);
	testText("A ~$:/sys/link please", {ignored: true});
	testText("A ~$:/sys/link please", {from: "~WikiLink", ignored: true});
	testText("A $:/sys/link please", "A [[to there]] please");
	testText("A $:/sys/link please", "A [[$:/to'there]] please", {to: "$:/to'there"});
	testText("A $:/sys/link please", "A [[content/$:/to/there]] please", {to: "content/$:/to/there"});
	testText("A $:/sys/link please", "A [[~$:/to/there]] please", {to: "~$:/to/there"});
});

it('rules pragma', function() {
	testText("\\rules except syslink\nA $:/sys/link please", {ignored: true});
});

it('tricky cases', function() {
	var tricky = "bad' title]]\"";
	var macro = utils.placeholder;
	var r = testText("A $:/sys/link please", macro(1,tricky)+"A <$link to=<<relink-1>>/> please", {to: tricky});
});

});
