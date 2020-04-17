/*\

Tests prettylinks.

\*/

var utils = require("test/utils");
var prettylink = require('$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/prettylink.js');

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

describe("prettylink", function() {

it('prettylinks', function() {
	var r = testText("Link to [[from here]].");
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in prettylink of tiddler 'test'"]);
	testText("Link to [[description|from here]].");
	testText("Link to [[weird]desc|from here]].");
	testText("Link to [[it is from here|from here]].", "Link to [[it is from here|to there]].");
	testText("Link [[new\nline|from here]].", "Link [[new\nline|from here]].");
	testText("Link to [[elsewhere]].");
	testText("Link to [[desc|elsewhere]].");
	testText("Multiple [[from here]] links [[description|from here]].");
	testText("Link to [[from here]].", {to: "to [bracket] there"});
});

it('unpretty with caption', function() {
	// single bracket on the end can disqualify prettylinks
	var r = testText("Link to [[caption|from here]].",
	                 "Link to <$link to='to [bracks]'>caption</$link>.",
	                 {to: "to [bracks]"});
	expect(r.log).toEqual(["Renaming 'from here' to 'to [bracks]' in prettylink of tiddler 'test'"]);
	// double brackets in middle can also disqualify prettylinks
	testText("Link to [[caption|from here]].",
	         "Link to <$link to='bracks [[in]] middle'>caption</$link>.",
	         {to: "bracks [[in]] middle"});
});

it('unpretty and without caption', function() {
	testText("Link to [[from here]].", "Link to <$link to=A]]B/>.",
	         {to: "A]]B"});
	var unquotable =  "very' bad]]title\"";
	// without a caption, we have to go straight to placeholders weird,
	// or we might desync the link with its caption with later name changes.
	var r = testText("Link to [[from here]].",
	                 utils.placeholder(1,unquotable) +
	                 "Link to <$link to=<<relink-1>>/>.",
	                 {to: unquotable});
	expect(r.log).toEqual(["Renaming 'from here' to '"+unquotable+"' in prettylink of tiddler 'test'"]);
});

it('unpretty, without caption, and pre 5.1.20', function() {
	// without a caption, we have to go straight to placeholders in <5.1.20,
	// It doesn't fill in <$link to="tiddler" /> with the caption of
	// "tiddler". Also, we must placeholder both caption and "to", or else
	// we might desync the link with its caption with later name changes.
	utils.monkeyPatch(prettylink, "shorthandSupported", () => false, function() {
		testText("Link to [[from here]].",
		         utils.placeholder(1, "to [bracks]") +
		         "Link to <$link to=<<relink-1>>><$text text=<<relink-1>>/></$link>.",
		         {to: "to [bracks]"});
	});
});

it('has dangerous caption content', function() {
	function wraps(caption, expected) {
		testText("[["+caption+"|from here]]",
	         "<$link to=to]]there>"+expected+"</$link>",
	         {to: "to]]there"});
	}
	// doesn't require <$text />
	wraps("Unsafe</$list>", "Unsafe</$list>");

	// requires <$text>
	wraps("Unsafe//caption", "<$text text='Unsafe//caption'/>");
	wraps("back`tick", "<$text text=back`tick/>");
	wraps("Unsafe<$link>", "<$text text='Unsafe<$link>'/>");
	// This one is tricky. That close link will close the widget we must
	// wrap the link in, but on its own, it renders same as plaintext.
	wraps("Unsafe</$link>", "<$text text='Unsafe</$link>'/>");
	// Another possibly tricky one. the <!-- might be inactive without -->
	testText("[[D<!--|from here]] --> C",
	         "<$link to=to]]there><$text text='D<!--'/></$link> --> C",
	         {to: "to]]there"});
});

it('has dangerous and unquotable caption content', function() {
	var caption = 'Misty\'s "{{crabshack}}"';
	testText("[["+caption+"|from here]]",
	         utils.placeholder("caption-1", caption)+"<$link to=to]]there><$text text=<<relink-caption-1>>/></$link>", {to: "to]]there"});
});

it('unquotable and unpretty', function() {
	// We also have to go to to placeholders if title doesn't work for
	// prettylinks or widgets.
	var to = 'Has apost\' [[bracks]] and "quotes"';
	var r =testText("Link to [[caption|from here]].",
	                utils.placeholder(1, to) +
	                "Link to <$link to=<<relink-1>>>caption</$link>.",
	                {to: to});
	expect(r.log).toEqual(["Renaming 'from here' to '"+to+"' in prettylink of tiddler 'test'"]);
});

it('respects rules', function() {
	testText("\\rules except prettylink\nLink to [[from here]].",
	         {ignored: true});
});

});
