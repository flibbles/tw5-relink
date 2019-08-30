/*\

Tests transcludes.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options.wiki.addTiddler(utils.operatorConf("title"));
	var t = utils.relink({text: text}, options);
	expect(t.fields.text).toEqual(expected);
};

function logMessage(toThere, but) {
	var msg = "Renaming 'from here' to '"+toThere+"' in filtered transclusion of tiddler 'test'"
	if (but) {
		msg = "%c" + msg + " %c" + but;
	}
	return msg;
};

describe("filtered transcludes", function() {

it('pretty', function() {
	var log = [];
	testText("{{{[[from here]]}}}", {log: log});
	expect(log).toEqual([logMessage("to there")]);
	testText("Inline {{{[[from here]]}}} List");
	testText("Block\n\n{{{[[from here]]}}}\n\nList");
	testText("{{{[[from here]]|tooltip}}}");
	testText("{{{[[from here]]||Template}}}");
	testText("{{{[[from here]]||from here}}}");
	testText("{{{[[title]]||from here}}}");
	testText("{{{[[from here]]|tooltip||Template}}}");
	testText("{{{[[from here]]|tooltip||Template}}}.class.class");
	testText("{{{[[from here]]|tooltip||Template}}width:40;}.class.class");
	// tricky titles
	testText("{{{[[from here]]}}}", {to: "to } there"});
});

it('preserves pretty whitespace', function() {
	testText("{{{   [[from here]]   }}}");
	testText("{{{   [[from here]]   ||  Template  }}}");
	testText("{{{   [[from here]]   ||  from here  }}}");
});

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("Test: {{{[[from here]]}}}.",
		         "Test: <$list filter='"+to+"'/>.",
		         {to: to});
	};
	// TODO: This is one case where we consider it unpretty, but it might
	// not be. If the transclusion is considered as a block, then the
	// required newline at the end may make this filter parse correctly.
	testUnpretty("Curly}}Closers");
	testUnpretty("Curly}}Closers}");
	testUnpretty("Bars|Bars");
});

it('unpretty (degrades to widget)', function() {
	function test(to, text, expected) {
		var log = [];
		testText(text, expected, {to: to, log: log});
		expect(log).toEqual([logMessage(to, "by converting it into a widget")]);
	};
	test("bar|here", "{{{[[from here]]}}}", "<$list filter='bar|here'/>");
	test("bar|here", "{{{[[from here]]}}}", "<$list filter='bar|here'/>");
	test("bar|","{{{A||from here}}}","<$list filter='A' template='bar|'/>");
	test("cur}","{{{A||from here}}}","<$list filter='A' template='cur}'/>");
	test("cur{","{{{A||from here}}}","<$list filter='A' template='cur{'/>");
	test("bar|", "{{{[[from here]]|tooltip||Template}}width:50;}.A.B",
	             "<$list filter='bar|' tooltip='tooltip' template='Template' style='width:50;' itemClass='A B'/>");
});

});
