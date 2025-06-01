/*\

Tests the import pragma (\import filter).

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
		utils.operatorConf("title")]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("import pragma", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('import pragma', function() {
	var r = testText("\\import [title[from here]]\nstuff.", true, ['\\import']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
	testText("\\rules except prettylink\n\\import [[from here]]\nnot prettylink.", true, ['\\import']);
	testText("\\import [[from|here]]\ndon't parse as prettylink.", true, ['\\import'],
	         {from: "from|here"});
	testText("\\import [title[from here]]\n\n\nnewlines.", true, ['\\import']);
	testText("\\import   [title[from here]]  \nwhitespace.", true, ['\\import']);
	testText("\\import [[from here]]\r\nwindows return.", true, ['\\import']);
	testText("\\import from\nsingle to double.",
	         "\\import [[to there]]\nsingle to double.",
	         ['\\import'],
	         {from: "from"});
});

// I think this
(utils.atLeastVersion('5.2.0') ? it : xit)('handles no newline', function() {
	// Technically, Tiddlywiki core is mishandling it, but it doesn't matter
	// for core, because an import with new newline means an import for no
	// reason at all.
	testText('\\import [[from here]]', true, ['\\import']);
});

it('tricky case', function() {
	const to = "bad\"\"\'\'[]name";
	utils.spyFailures(spyOn);
	testText("\\import [[from here]]\nstuff", false, ['\\import'], {to: to});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('failure casese', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf('tag'),
		utils.operatorConf('list', 'reference'),
		utils.operatorConf('wiki', 'wikitext')]);
	utils.spyFailures(spyOn);
	function testFail(input, report, toTitle, fromTitle) {
		var options = {to: toTitle, wiki: wiki};
		if (fromTitle) {
			options.from = fromTitle;
		}
		testText(input, false, report, options);
	};
	var to = "bad[]name";
	testFail("\\import [tag[from here]prefix[A]]\n", ['\\import [tag[]]'], to);
	to = "worse[]\"\"\'\'name";
	// This one actually shouldn't have to fail
	testFail("\\import [[from here]]\n", ['\\import'], to);
	testFail("\\import from\n", ['\\import'], to, "from");
	testFail("\\import +'from here'\n", ['\\import +'], to);
	testFail("\\import [![from here]]\n", ['\\import [![]]'], to);
	testFail("\\import [list[from here!!field]]\n", ['\\import [list[!!field]]'], "A]]B");
	testFail("\\import [wiki[X {{from here}}]]\n", ['\\import [wiki[{{}}]]'], to);
});

it('handles failures', function() {
	utils.spyFailures(spyOn);
	testText("\\import [tag{from here}]\nstuff", false, ['\\import [tag{}]'], {to: "to}there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("handles tricky importing using just-imported variables", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'localA', tags: 'imports', text: '\\define second() localB\n'},
		{title: 'localB', text: '\\relink third var\n\\define third(var) t\n'}]);
	testText("\\import [tag[imports]]\n\\import [<second>]\n<<third 'from here'>>\n", true, ["<<third var>>"], {wiki: wiki});
});

});
