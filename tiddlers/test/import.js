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
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test': \\import [title[]]");
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

it('handles no newline', function() {
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
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to '"+to+"' in 'test': \\import");
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
