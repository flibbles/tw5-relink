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
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in 'test': \\import [title[]]"]);
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
	expect(r.log).toEqual(["Renaming 'from here' to '"+to+"' in 'test': \\import"]);
});

it('handles failures', function() {
	var r = testText("\\import [tag{from here}]\nstuff",
	                 {ignored: true, to: "to}there", fails: 1});
});

it("reports", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(utils.setupTiddlers());
	function test(tiddler, expected) {
		wiki.addTiddler(tiddler);
		var refs = wiki.getTiddlerRelinkReferences(tiddler.title);
		expect(refs).toEqual(expected);
	};
	test({title: 'A', text: "\\import [tag[from]]\n"}, {from: ["\\import [tag[]]"]});
	test({title: 'B', text:  "\\import from\n[[link]]"}, {from: ["\\import"], link: ['[[link]]']});
	wiki.addTiddlers([
		{title: 'localA', tags: 'imports', text: '\\define second() localB\n'},
		{title: 'localB', text: '\\relink third var\n\\define third(var) t\n'}]);
	test({title: 'C', text: "\\import [tag[imports]]\n\\import [<second>]\n<<third mytitle>>\n"}, {imports: ["\\import [tag[]]"], mytitle: ["<<third var>>"]});
});

});
