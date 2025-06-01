/*\

Tests prettylinks.

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


describe("image", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it("image", function() {
	testText("Image to [img[from here]].", true, ['[img[]]']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
	testText("to [img[from here]][[from here]]", true, ['[img[]]', '[[from here]]']);
	// quotes can make us scan too early for the source
	testText("[img class='a' [']].",
	         "[img class='a' [to there]].",
	         ['[img[]]'],
	         {from: "'"});
});

it("handles tricky prepended text", function() {
	testText("width='from here' [img width={{from here}} [s]]",
	         "width='from here' [img width={{to there}} [s]]",
	         ['[img width={{}}]']);
});

it("image respects \\rules", function() {
	testText("\\rules only image\n[img[from here]]", true, ['[img[]]']);
	testText("\\rules except html macrodef\n[img[from here]]", true, ['[img[]]']);

	testText("\\rules except image\n[img[from here]]", false, undefined);
	testText("\\rules only html macrodef\n[img[from here]]", false, undefined);
	utils.spyFailures(spyOn);

	function testFails(text, to, options) {
		options = Object.assign({to: to}, options);
		utils.failures.calls.reset();
		testText(text, false, ['[img[]]'], options);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	testFails("\\rules except html\n[img[from here]]", "to]there");
	testFails("\\rules only image macrodef\n[img[from here]]", "to]there");
	testFails("\\rules except macrodef\n[img[from here]]", '"F]] ```\'"');
});

it("indirect attributes", function() {
	testText("[img width={{from here}} [s]]", true, ['[img width={{}}]']);
	testText("[img width  =  {{from here}} [s]]", true, ['[img width={{}}]']);
	testText("[img width={{from here!!width}} [s]]", true, ['[img width={{!!width}}]']);
	testText("[img width={{from here##width}} [s]]", true, ['[img width={{##width}}]']);
	utils.spyFailures(spyOn);
	testText("[img width={{from here}} [from here]]",
			 "[img width={{from here}} [brack}]]",
			 ['[img width={{}}]', '[img[]]'], {to: "brack}"});
	expect(utils.failures).toHaveBeenCalledTimes(1);

	utils.failures.calls.reset();
	testText("[img width={{from here}} [from here]]",
			 "[img width={{from here}} [A!!B]]",
			 ['[img width={{}}]', '[img[]]'], {to: "A!!B"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("filtered attributes", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	testText("[img width={{{[[from here]] [tag[from here]]}}} [s]]", true, ['[img width={{{}}}]', '[img width={{{[tag[]]}}}]'], {wiki: wiki});
	testText("[img width  =  {{{  [tag[from here]]   }}} [s]]", true, ['[img width={{{[tag[]]}}}]'], {wiki: wiki});
	utils.spyFailures(spyOn);
	testText("[img width={{{[tag[from here]]}}} [s]].", false, ['[img width={{{[tag[]]}}}]'], {to: "A]B", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);

	utils.failures.calls.reset();
	testText("[img width={{{[r{from here}]}}} [from here]]",
			 "[img width={{{[r{from here}]}}} [A}}}B]]",
			 ['[img width={{{[r{}]}}}]', '[img[]]'], {to:"A}}}B"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("macro attributes", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("ten", "tiddler"));
	const macros = "\\define ten(tiddler) 10\n";

	testText(macros+"[img width=<<ten 'from here'>> [s]]", true, ['[img width=<<ten tiddler>>]'], {wiki: wiki});
	utils.spyFailures(spyOn);
	testText(macros+"[img width=<<ten 'from here'>> [s]] [[from here]]",
			 macros+"[img width=<<ten 'from here'>> [s]] [[A ']B\"]]",
			 ['[img width=<<ten tiddler>>]', '[[from here]]'],
			 {to: "A ']B\"", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("whitespace surrounding values", function() {
	function testA(text, expected, report) {
		return testText(text, expected, report, {from: "a"});
	};
	// These tests use a single-character title so we can better make sure
	// we're start our indexOf searches in the right place. Long titles
	// would be more forgiving.
	testA("Img [img[a]].",     "Img [img[to there]].", ['[img[]]']);
	testA("Img [img[a  ]].",     "Img [img[to there  ]].", ['[img[]]']);
	testA("Img [img[ a ]].",     "Img [img[ to there ]].", ['[img[]]']);
	testA("Img [img[  a]].",     "Img [img[  to there]].", ['[img[]]']);
	testA("Img [img[a|a]].",   "Img [img[a|to there]].", ['[img[a]]']);
	testA("Img [img[a  |a]].", "Img [img[a  |to there]].", ['[img[a]]']);
	testA("Img [img[ a |a]].", "Img [img[ a |to there]].", ['[img[a]]']);
	testA("Img [img[  a|a]].", "Img [img[  a|to there]].", ['[img[a]]']);
	testA("Img [img[a|a  ]].", "Img [img[a|to there  ]].", ['[img[a]]']);
	testA("Img [img[a| a ]].", "Img [img[a| to there ]].", ['[img[a]]']);
	testA("Img [img[a|  a]].", "Img [img[a|  to there]].", ['[img[a]]']);
	testA("Img [img[\na\n|\na\n]].", "Img [img[\na\n|\nto there\n]].", ['[img[a]]']);
	testA("Img [img    class=a [a]].", "Img [img    class=a [to there]].", ['[img[]]']);
});

it("Handles correctly when no change", function() {
	testText("content here [img[link]]", false, undefined);
	testText("[img[link]][[from here]]", true, ['[[from here]]']);
	testText("[img[description|link]][[from here]]", true, ['[[from here]]']);
	testText("[img width=32 height=32 [des|link fromHere]][[from here]]",
	         "[img width=32 height=32 [des|link fromHere]][[to there]]",
	         ['[[from here]]']);
});

it("unpretty source", function() {
	testText("Image [img[from here]] end",
	         "Image <$image source=to]there/> end",
	         ['[img[]]'],
	         {to: "to]there"});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to]there' in 'test'");
	testText("Image [img[Description|from here]] end",
	         "Image <$image tooltip=Description source=to]there/> end",
	         ['[img[Description]]'],
	         {to: "to]there"});
	testText("[img\nwidth=250\n[caption|from here]] end",
	         "<$image\nwidth=250\ntooltip=caption source=to]there/> end",
	         ['[img[caption]]'],
	         {to: "to]there"});
	testText("[img[  caption  |  from here  ]] end",
	         "<$image   tooltip=caption    source=to]there  /> end",
	         ['[img[caption]]'],
	         {to: "to]there"});
	// Tricky bars
	testText("[img[from here]] end",
	         "<$image source=to|there/> end",
	         ['[img[]]'],
	         {to: "to|there"});
	testText("[img[Caption|from here]] end",
	         "[img[Caption|to|there]] end",
	         ['[img[Caption]]'],
	         {to: "to|there"});
});

it("unpretty source and bad widget", function() {
	const title = '"F]]```\'"'
	utils.spyFailures(spyOn);
	testText("Image [img[Description|from here]] end", false, ['[img[Description]]'], {to: title});
	expect(utils.failures).toHaveBeenCalledTimes(1);

});

});
