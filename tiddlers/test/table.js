/*\

Tests tables.

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
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("table", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('works', function() {
	// Issue #32: transcludes in tables didn't work.
	testText("|{{from here}}|", true, ['|{{}}|']);
	testText("|{{from here}}|\n", true, ['|{{}}|']);
	testText("|{{from here}}|\r\n", true, ['|{{}}|']);
	testText("|{{from here}}|\nstuff", true, ['|{{}}|']);
	testText("|{{from here}}|\r\nstuff", true, ['|{{}}|']);
	testText("|{{from here||template}}|", true, ['|{{||template}}|']);
});

it('headers', function() {
	testText("|[[from here]]|h\n|something|", true, ['|[[from here]]|h']);
	testText("|first|\n|[[from here]]|h\n|else|", true, ['|[[from here]]|h']);

	testText("|![[from here]]|A|B|", true, ['|![[from here]]|']);
});

it('footers', function() {
	testText("|[[from here]]|f\n|something|", true, ['|[[from here]]|f']);
	testText("|first|\n|[[from here]]|f\n|else|", true, ['|[[from here]]|f']);
});

it('classes', function() {
	// Classes are taken as plaintext. There can't be any links in them.
	testText("|[[from here]]|k\n|[[from here]]|",
	         "|[[from here]]|k\n|[[to there]]|", ['|[[from here]]|']);
	testText("|first|\n|{{from here}}|k\n|{{from here}}|",
	         "|first|\n|{{from here}}|k\n|{{to there}}|", ['|{{}}|']);
});

it('captions', function() {
	// Classes are taken as plaintext. There can't be any links in them.
	testText("|[[from here]] | blah|c\n|stuff|", true, ['|[[from here]]|c']);
	testText("|first|\n|a{{from here}}b|c\n| stuff|", true, ['|{{}}|c']);
	// Doesn't process like a cell
	testText("|first|\n|! {{from here}}|c", true, ['|{{}}|c']);
	// Non relinkable captions don't crash
	testText("|{{from here}}|\n|! no relink |c", true, ['|{{}}|']);
});

it('alignment', function() {
	testText("|{{from here}}|", true, ['|{{}}|']);
	testText("|{{from here}} |", true, ['|{{}} |']);
	testText("| {{from here}}|", true, ['| {{}}|']);
	testText("| {{from here}} |", true, ['| {{}} |']);
	testText("|    {{from here}}    |", true, ['| {{}} |']);
	testText("|^{{from here}}|", true, ['|^{{}}|']);
	testText("|,{{from here}}|", true, ['|,{{}}|']);
	testText("|^ {{from here}}|", true, ['|^ {{}}|']);
	testText("|, {{from here}}|", true, ['|, {{}}|']);
	testText("|^^{{from here}}^^|", true, ['|{{}}|']);
	testText("|,,{{from here}},,|", true, ['|{{}}|']);
	testText("|^^^{{from here}}^^|", true, ['|^{{}}|']);
	testText("|,,,{{from here}},,|", true, ['|,{{}}|']);
	testText("|^ ^^{{from here}}^^|", true, ['|^ {{}}|']);
	testText("|, ,,{{from here}},,|", true, ['|, {{}}|']);
	testText("|^!{{from here}} |", true, ['|^!{{}} |']);
	// Tiddlywiki acts weird here, but the space comes before !
	testText("|!{{from here}}|", true, ['|!{{}}|']);
	testText("|! {{from here}}|", true, ['|!{{}}|']);
	testText("| !{{from here}} |", true, ['| !{{}} |']);
	testText("|,!{{from here}}|", true, ['|,!{{}}|']);
	testText("|^ !{{from here}}|", true, ['|^ !{{}}|']);

	// Cases which are probably user error
	testText("|!^{{from here}}|", true, ['|!{{}}|']);
	testText("|!, {{from here}}|", true, ['|!{{}}|']);
});

it('cell merges still parse', function() {
	testText(`
|Cell1 |Cell2 |Cell3 |Cell4 |
|Cell5 |[[from]] |[[from]] |<|
|Cell5 |~|Cell7 |Cell8 |
|>|[[from]] |Cell10 |Cell11 |`, true,
	['|[[from]] |', '|[[from]] |', '|[[from]] |'],
	{from: 'from', to: 'to'});
});

it('strange cell merges', function() {
	// Left merge when already on left
	testText('| A | B |\n|<| {{from here}} |', true, ['| {{}} |']);
	testText('| A |>|\n| B | {{from here}} |', true, ['| {{}} |']);
	testText('|~| {{from here}} |\n| B | C |', true, ['| {{}} |']);
});

it('handles errors', function() {
	utils.spyFailures(spyOn);
	testText("| <$text text={{from here}} /> | [[from here]] |",
	         "| <$text text={{from here}} /> | [[to!!there]] |",
	         ['| <$text text={{}} /> |', '| [[from here]] |'],
	         {to: "to!!there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText("| test |<$text text={{from here}} /> [[from here]]|c",
	         "| test |<$text text={{from here}} /> [[to!!there]]|c",
	         ['|<$text text={{}} />|c', '|[[from here]]|c'],
	         {to: "to!!there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('unpretty', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText('| test |[[from here]]|', false,
	         ['|[[from here]]|'], {to: "bad' ``` titles]]\"", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

});
