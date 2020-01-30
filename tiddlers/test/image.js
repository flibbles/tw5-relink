/*\

Tests prettylinks.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

describe("image", function() {

it("image", function() {
	var r = testText("Image to [img[from here]].");
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in image of tiddler 'test'"]);
	testText("to [img[from here]][[from here]]");
	// quotes can make us scan too early for the source
	testText("[img class='a' [']].",
	         "[img class='a' [to there]].",
	         {from: "'"});
});

it("indirect attributes", function() {
	testText("[img width={{from here}} [s]]");
	testText("[img width  =  {{from here}} [s]]");
	testText("[img width={{from here!!width}} [s]]");
	testText("[img width={{from here##width}} [s]]");
	var r;
	r = testText("[img width={{from here}} [s]]", {to: "title}brack", ignored: true});
	expect(r.fails.length).toEqual(1);
	r = testText("[img width={{from here}} [s]]", {to: "title!!bang", ignored: true});
	expect(r.fails.length).toEqual(1);
});

it("filtered attributes", function() {
	testText("[img width={{{[tag[from here]]}}} [s]]");
	testText("[img width  =  {{{  [tag[from here]]   }}} [s]]");
	testText("[img width={{{[tag[from here]]}}} [s]].",
	         "\\define relink-1() A]B\n[img width={{{[tag<relink-1>]}}} [s]].", {to: "A]B"});
	var r = testText("[img width={{{[[from here]]}}} [s]]", {to: "A}}}B", ignored: true});
	expect(r.fails.length).toEqual(1);
});

it("macro attributes", function() {
	function test(value, expected, options) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler(utils.macroConf("ten", "tiddler"));
		var macros = "\\define ten(tiddler) 10\n";
		return testText(macros+value, macros+expected,
		                Object.assign({wiki: wiki}, options));
	};
	var original = "[img width=<<ten 'from here'>> [s]]";
	test(original, "[img width=<<ten 'to there'>> [s]]");
	var r = test(original, original, {to: "A>>'\"\"\"]]B"});
	expect(r.fails.length).toEqual(1);
});

it("whitespace surrounding values", function() {
	function testA(text, expected) {
		return testText(text, expected, {from: "a"});
	};
	// These tests use a single-character title so we can better make sure
	// we're start our indexOf searches in the right place. Long titles
	// would be more forgiving.
	testA("Img [img[a]].",     "Img [img[to there]].");
	testA("Img [img[a  ]].",     "Img [img[to there  ]].");
	testA("Img [img[ a ]].",     "Img [img[ to there ]].");
	testA("Img [img[  a]].",     "Img [img[  to there]].");
	testA("Img [img[a|a]].",   "Img [img[a|to there]].");
	testA("Img [img[a  |a]].", "Img [img[a  |to there]].");
	testA("Img [img[ a |a]].", "Img [img[ a |to there]].");
	testA("Img [img[  a|a]].", "Img [img[  a|to there]].");
	testA("Img [img[a|a  ]].", "Img [img[a|to there  ]].");
	testA("Img [img[a| a ]].", "Img [img[a| to there ]].");
	testA("Img [img[a|  a]].", "Img [img[a|  to there]].");
	testA("Img [img[\na\n|\na\n]].", "Img [img[\na\n|\nto there\n]].");
	testA("Img [img    class=a [a]].", "Img [img    class=a [to there]].");
});

it("Handles correctly when no change", function() {
	testText("content here [img[link]]", "content here [img[link]]");
	testText("[img[link]][[from here]]");
	testText("[img[description|link]][[from here]]");
	testText("[img width=32 height=32 [des|link fromHere]][[from here]]",
	         "[img width=32 height=32 [des|link fromHere]][[to there]]");
});

it("unpretty source", function() {
	var r = testText("Image [img[from here]] end",
	                 "Image <$image source=to]there/> end",
	                 {to: "to]there"});
	expect(r.log).toEqual(["%cRenaming 'from here' to 'to]there' in image of tiddler 'test' %cby converting it into a widget"]);
	testText("Image [img[Description|from here]] end",
	         "Image <$image tooltip=Description source=to]there/> end",
	         {to: "to]there"});
	testText("[img\nwidth=250\n[caption|from here]] end",
	         "<$image\nwidth=250\ntooltip=caption source=to]there/> end",
	         {to: "to]there"});
	testText("[img[  caption  |  from here  ]] end",
	         "<$image   tooltip=caption    source=to]there  /> end",
	         {to: "to]there"});
	// Tricky bars
	testText("[img[from here]] end",
	         "<$image source=to|there/> end",
	         {to: "to|there"});
	testText("[img[Caption|from here]] end",
	         "[img[Caption|to|there]] end",
	         {to: "to|there"});
});

it("unpretty source and bad widget", function() {
	var title = '"F]]\'"'
	var r = testText("Image [img[Description|from here]] end",
	                 "\\define relink-1() "+title+"\nImage <$image tooltip=Description source=<<relink-1>>/> end",
	                 {to: title});
	expect(r.log).toEqual(["%cRenaming 'from here' to '"+title+"' in image of tiddler 'test' %cby converting it into a widget and creating placeholder macros"]);

});

});
