/*\

Tests the import pragma (\import filter).

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options.wiki.addTiddler(utils.operatorConf("title"));
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

describe("import pragma", function() {

it('import pragma', function() {
	var r = testText("\\import [title[from here]]\nstuff.");
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in \\import filter of tiddler 'test'"]);
	testText("\\rules except prettylink\n\\import [[from here]]\nnot prettylink.");
	testText("\\import [[from|here]]\ndon't parse as prettylink.",
	         {from: "from|here"});
	testText("\\import [title[from here]]\n\n\nnewlines.");
	testText("\\import   [title[from here]]  \nwhitespace.");
	testText("\\import [[from here]]\r\nwindows return.");
	testText("\\import from\nsingle to double.",
	         "\\import [[to there]]\nsingle to double.",
	         {from: "from"});

});

it('tricky downgrade', function() {
	var to = "bad\"\"\'\'[]name";
	var r = testText("\\import [[from here]]\nstuff",
	         utils.placeholder(1,to)+"\\import [<relink-1>]\nstuff",
	         {to: to});
	expect(r.log).toEqual(["%cRenaming 'from here' to '"+to+"' in \\import filter of tiddler 'test' %cby creating placeholder macros"]);
});

});
