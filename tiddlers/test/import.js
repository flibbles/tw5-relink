/*\

Tests the import pragma (\import filter).

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
	var r = testText("\\import [title[from here]]\nstuff.", true, ['\\import [title[]]']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
	testText("\\rules except prettylink\n\\import [[from here]]\nnot prettylink.", true, ['\\import']);
	testText("\\import [[from|here]]\ndon't parse as prettylink.", true, ['\\import'],
	         {from: "from|here"});
	testText("\\import [title[from here]]\n\n\nnewlines.", true, ['\\import [title[]]']);
	testText("\\import   [title[from here]]  \nwhitespace.", true, ['\\import [title[]]']);
	testText("\\import [[from here]]\r\nwindows return.", true, ['\\import']);
	testText("\\import from\nsingle to double.",
	         "\\import [[to there]]\nsingle to double.",
	         ['\\import'],
	         {from: "from"});
});

// I think this
((utils.version() >= 24) ? it : xit)('handles no newline', function() {
	// Technically, Tiddlywiki core is mishandling it, but it doesn't matter
	// for core, because an import with new newline means an import for no
	// reason at all.
	testText('\\import [[from here]]', true, ['\\import']);
});

it('tricky downgrade', function() {
	const to = "bad\"\"\'\'[]name";
	testText("\\import [[from here]]\nstuff",
	         utils.placeholder(1,to)+"\\import [<relink-1>]\nstuff",
	         ['\\import'],
	         {to: to});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to '"+to+"' in 'test'");
});

it('resorts to placeholders when possible', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf('tag'),
		utils.operatorConf('list', 'reference'),
		utils.operatorConf('wiki', 'wikitext')]);
	var ph = utils.placeholder;
	var to = "bad[]name";
	testText("\\import [tag[from here]prefix[A]]\n",
	         ph(1,to)+"\\import [tag<relink-1>prefix[A]]\n",
	         ['\\import [tag[]]'], {to: to, wiki: wiki});
	to = "worse[]\"\"\'\'name";
	testText("\\import [[from here]]\n",
	         ph(1,to)+"\\import [<relink-1>]\n",
	         ['\\import'], {to: to, wiki: wiki});
	testText("\\import from\n",
	         ph(1,to)+"\\import [<relink-1>]\n",
	         ['\\import'], {to: to, from: "from", wiki: wiki});
	testText("\\import +'from here'\n",
	         ph(1,to)+"\\import +[<relink-1>]\n",
	         ['\\import +'], {to: to, wiki: wiki});
	testText("\\import [![from here]]\n",
	         ph(1,to)+"\\import [!<relink-1>]\n",
	         ['\\import [![]]'], {to: to, wiki: wiki});
	testText("\\import [list[from here!!field]]\n",
	         ph("reference-1", "A]]B!!field")+"\\import [list<relink-reference-1>]\n",
	         ['\\import [list[!!field]]'], {to: "A]]B", wiki: wiki});
	testText("\\import [wiki[X {{from here}}]]\n",
	         ph("wikitext-1","X {{"+to+"}}")+"\\import [wiki<relink-wikitext-1>]\n",
	         ['\\import [wiki[{{}}]]'], {to: to, wiki: wiki});
});

it('handles failures', function() {
	var failures = utils.collectFailures(function() {
		testText("\\import [tag{from here}]\nstuff", false, ['\\import [tag{}]'], {to: "to}there"});
	});
	expect(failures.length).toBe(1);
});

it("handles tricky importing using just-imported variables", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'localA', tags: 'imports', text: '\\define second() localB\n'},
		{title: 'localB', text: '\\relink third var\n\\define third(var) t\n'}]);
	testText("\\import [tag[imports]]\n\\import [<second>]\n<<third 'from here'>>\n", true, ["<<third var>>"], {wiki: wiki});
});

});
