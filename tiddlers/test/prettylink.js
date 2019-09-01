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
	expect(r.log).toEqual(["%cRenaming 'from here' to 'to [bracks]' in prettylink of tiddler 'test' %cby converting it into a widget"]);
	// double brackets in middle can also disqualify prettylinks
	testText("Link to [[caption|from here]].",
	         "Link to <$link to='bracks [[in]] middle'>caption</$link>.",
	         {to: "bracks [[in]] middle"});
});

it('unpretty and without caption', function() {
	// without a caption, we have to go straight to placeholders weird,
	// or we might desync the link with its caption with later name changes.
	var r = testText("Link to [[from here]].",
	                 utils.placeholder(1, "to [bracks]") +
	                 "Link to <$link to=<<relink-1>>><$text text=<<relink-1>>/></$link>.",
	                 {to: "to [bracks]"});
	expect(r.log).toEqual(["%cRenaming 'from here' to 'to [bracks]' in prettylink of tiddler 'test' %cby converting it into a widget and creating placeholder macros"]);
});

it('unquotable and unpretty', function() {
	// We also have to go to to placeholders if title doesn't work for
	// prettylinks or widgets.
	var to = 'Has apost\' [[bracks]] and "quotes"';
	var r =testText("Link to [[caption|from here]].",
	                utils.placeholder(1, to) +
	                "Link to <$link to=<<relink-1>>>caption</$link>.",
	                {to: to});
	expect(r.log).toEqual(["%cRenaming 'from here' to '"+to+"' in prettylink of tiddler 'test' %cby converting it into a widget and creating placeholder macros"]);
});

it('respects rules', function() {
	testText("\\rules except prettylink\nLink to [[from here]].",
	         {ignored: true});
});

});
