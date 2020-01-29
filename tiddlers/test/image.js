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

});
