/*\
tags: $:/tags/test-spec
title: test/text.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/

var relink = require("test/utils").relink;

describe("text", function() {

function testText(text, expected, options) {
	if (typeof expected !== "string") {
		options = expected || {};
		if (options && options.ignored) {
			expected = text;
		} else {
			var from = options.from || "from here";
			var to = options.to || "to there";
			expected = text.replace(new RegExp(from, "g"), to);
		}
	}
	options = options || {};
	options.wiki = options.wiki || new $tw.Wiki();
	var prefix = "$:/config/flibbles/relink/attributes/";
	options.wiki.addTiddlers([
		{title: prefix + "$link/to", text: "field"},
		{title: prefix + "$list/filter", text: "filter"},
	]);
	var t = relink({text: text}, options);
	expect(t.fields.text).toEqual(expected);
};

it('allows all other unmanaged wikitext rules', function() {
	function fine(text) { testText(text + " [[from here]]", {ignore: true}); };
	fine("This is ordinary text");
	fine("This is a WikiLink here");
	fine("This \n*is\n*a\n*list");
	fine("Image: [img[https://google.com]] and [img[Title]] here");
	fine("External links: [ext[https://google.com]] and [ext[Tooltip|https://google.com]] here");
	fine("Comments <!-- Look like this -->");
	fine("Block Comments\n\n<!--\n\nLook like this? -->\n\n");
});

it('prettylinks ignore plaintext files', function() {
	var wiki = new $tw.Wiki();
	var text = "This is [[from here]] to there.";
	var t = relink({text: text, type: "text/plain"}, {wiki: wiki});
	expect(t.fields.text).toEqual(text);
});

it('handles managed rules inside unmanaged rules', function() {
	testText("List\n\n* [[from here]]\n* Item\n");
	testText("<div>\n\n[[from here]]</div>");
	testText("<!--\n\n[[from here]]-->", {ignored: true});
});

it('prettylinks', function() {
	testText("Link to [[from here]].");
	testText("Link to [[description|from here]].");
	testText("Link to [[weird]desc|from here]].");
	testText("Link to [[it is from here|from here]].", "Link to [[it is from here|to there]].");
	testText("Link [[new\nline|from here]].", "Link [[new\nline|from here]].");
	testText("Link to [[elsewhere]].");
	testText("Link to [[desc|elsewhere]].");
	testText("Multiple [[from here]] links [[description|from here]].");
});

it('field attributes', function() {
	testText('<$link to="from here">caption</$link>');
	testText('<$link to="from here">\n\ncaption</$link>\n\n');
	testText(`<$link to='from here'>caption</$link>`);
	testText(`<$link to='from here' />`);
	testText('Before <$link to="from here">caption</$link> After');
	testText(`<$link tag="div" to="from here">caption</$link>`);
	testText(`<$link aria-label="true" to="from here">caption</$link>`);
	testText(`<$link to='from here'>caption</$link><$link to="from here">another</$link>`);
	testText(`<$link to='from here'>caption</$link>In between content<$link to="from here">another</$link>`);
	testText(`<$link to    =   "from here">caption</$link>`);
	testText("<$link\nto='from here'>caption</$link>");
	testText("<$link to='from here'\n/>");
	testText("<$link\ntag='div'\nto='from here'>caption</$link>");
	testText("<$link\n\ttag='div'\n\tto='from here'>caption</$link>");
	testText(`Beginning text <$link to="from here">caption</$link> ending`);
	// extra tricky
	testText(`<$link tooltip="link -> dest" to="from here" />`);
	// ignores
	testText(`<$link >to="from here"</$link>`, {ignored: true});
	testText(`<$link to="from here"`, {ignored: true});
	testText(`<$LINK to="from here" />`, {ignored: true});
	testText(`<$link TO="from here" />`, {ignored: true});
	testText(`<$link to=<<from>> />`, {from: "from", ignored: true});
});

it('field attributes with true', function() {
	testText(`<$link trueAttr to="from here">caption</$link>`);
	testText(`<$link to />`);
	testText(`<$link to />`, {from: "true"});
	testText(`<$link to/> <$link to=true/>`, `<$link to/> <$link to='to there'/>`, {from: "true"});
	testText(`<$link to /> <$link to=true />`, `<$link to /> <$link to='to there' />`, {from: "true"});
	testText(`<$link to       /> <$link to=true />`, `<$link to       /> <$link to='to there' />`, {from: "true"});
});

it('field attributes fun with quotes', function() {
	function testQuote(from, to, options) {
		testText(`<$link to=${from}/>`, `<$link to=${to}/>`, options);
	};
	testQuote(`"""from here"""`, `"""to there"""`);
	testQuote(`from`, `'to there'`, {from: "from"});
	testQuote(`from`, `"Jenny's"`, {from: "from", to: "Jenny's"});
	testQuote(`'"good" boy'`, `"cat's"`, {from: '"good" boy', to: "cat's"});
	testQuote(`"""from here"""`, `'love """ hate'`, {to: 'love """ hate'});

	// It prefers quoteless when given quoteless, but only when possible.
	testQuote(`love`, `hate`, {from: "love", to: "hate"});
	testQuote(`love`, `"lover's"`, {from: "love", to: "lover's"});
	$tw.utils.each('= <>/"\n\t', function(ch) {
		testQuote(`A`, `'te${ch}st'`, {from: "A", to: `te${ch}st`});
	});
});

it('filter attributes', function() {
	var prefix = "$:/config/flibbles/relink/";
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: prefix + "attributes/$list/filter", text: "filter"},
		{title: prefix + "operators/title", text: "yes"}
	]);
	testText(`<$list filter="A [[from here]] B" />`, {wiki: wiki});
	testText(`<$list nothing="A [[from here]] B" />`, {wiki: wiki, ignored: true});
});

});
