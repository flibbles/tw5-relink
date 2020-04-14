/*\

Tests transcludes.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

function logMessage(toThere) {
	return "Renaming 'from here' to '"+toThere+"' in filtered transclusion of tiddler 'test'"
};

describe("filtered transcludes", function() {

it('pretty', function() {
	var r = testText("{{{[[from here]]}}}");
	expect(r.log).toEqual([logMessage("to there")]);
	testText("Inline {{{[[from here]]}}} List");
	testText("Block\n\n{{{[[from here]]}}}\n\nList");
	testText("Block\n{{{[[from here]]}}}.class\nList");
	testText("Block\r\n{{{[[from here]]}}}\r\nList");
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

it('from titles with curlies', function() {
	testText("{{{has{curls}}}}", {from: "has{curls}", to: "there"});
	testText("{{{has{curls}}}}}}", {from: "has{curls}}}", to: "there"});
	// Inline rule won't match this correctly, so we shouldn't either.
	testText("{{{has{curls}}}} inline", {from: "has{curls}",ignored: true});
});

it('preserves pretty whitespace', function() {
	testText("{{{   [[from here]]   }}}");
	testText("{{{   [[from here]]   ||  Template  }}}");
	testText("{{{   [[from here]]   ||  from here  }}}");
});

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("Test: {{{[[from here]]}}}.",
		         "Test: <$list filter="+to+"/>.",
		         {to: to});
	};
	testUnpretty("Curly}}Closers");
	// This doesn't have to become unpretty if it's considered as a block,
	// since the block parser goes to the end of the line and therefor
	// correctly parses the curly braces.
	// However, it's too much work to test for, so just downgrade it.
	testUnpretty("Curly}}Closers}");
	testUnpretty("Bars|Bars");
});

it('unpretty (degrades to widget)', function() {
	function test(to, text, expected) {
		var results = testText(text, expected, {to: to});
		var message = logMessage(to);
		expect(results.log).toEqual([message]);
	};
	test("bar|here", "{{{[[from here]]}}}", "<$list filter=bar|here/>");
	test("bar|here", "{{{[[from here]]}}}", "<$list filter=bar|here/>");
	test("bar|","{{{A||from here}}}","<$list filter=A template=bar|/>");
	test("cur}","{{{A||from here}}}","<$list filter=A template=cur}/>");
	test("cur{","{{{A||from here}}}","<$list filter=A template=cur{/>");
	test("bar|", "{{{[[from here]]|tooltip||Template}}width:50;}.A.B",
	             "<$list filter=bar| tooltip=tooltip template=Template style=width:50; itemClass='A B'/>");

	// preserves block newline whitespace
	test("A|B", "{{{[[from here]]}}}\nTxt", "<$list filter=A|B/>\nTxt");
	test("A|B", "{{{[[from here]]}}}\r\nTxt", "<$list filter=A|B/>\r\nTxt");
});

it('unpretty and unquotable', function() {
	var ph = utils.placeholder;
	function test(to, text, expected) {
		var message = message;
		var results = testText(text, expected, {to: to});
	};
	var weird = 'a\'|" """x';
	//test(`{{{[[""""'']] [[from here]]}}}`
	//test(weird, `{{{[[from here]]}}}`, ph(1,weird) + "<$list filter='[<relink-1>]'");
	test("bad[]title",
	     "{{{[title[from here]]}}}",
	     ph(1, "bad[]title")+"{{{[title<relink-1>]}}}");
	var tooltip = `"tooltips's"`;
	test(weird, "{{{Title||from here}}}", ph(1,weird) + "<$list filter=Title template=<<relink-1>>/>");
	test("bar|bar", "{{{Title|"+tooltip+"||from here}}}", ph("tooltip-1",tooltip) + "<$list filter=Title tooltip=<<relink-tooltip-1>> template=bar|bar/>");
});

});
