/*\

Tests widget and HTML element attributes.

\*/

var utils = require("test/utils");

describe("attributes", function() {

function attrConf(element, attribute, type) {
	var prefix = "$:/config/flibbles/relink/attributes/";
	return {title: prefix + element + "/" + attribute, text: type};
};

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var prefix = "$:/config/flibbles/relink/attributes/";
	options.wiki.addTiddlers([
		attrConf("$link", "to", "title"),
		attrConf("$list", "filter", "filter"),
		utils.operatorConf("title"),
		utils.operatorConf("tag")
	]);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

it('field attributes', function() {
	var r = testText('<$link to="from here">caption</$link>');
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in <$link to /> attribute of tiddler 'test'"]);
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

	// Now for the super advanced quotes!! //
	testQuote("from", `""""begins" with quote; has apos'"""`, {from: "from", to: `"begins" with quote; has apos'`});
});

it('supports indirect attribute values', function() {
	testText("<$link to={{from here}}/>");
	testText("<$link to={{from here!!field}}/>");
	testText("<$link to={{from here##index}}/>");
	testText("<$link to   =   {{from here!!field}} />");
	// Works on otherwise unmanaged attributes too
	var r = testText("<$text text={{from here!!field}} />");
	var to = "title}withBracket";
	var options = {to: to, ignored: true};
	var results = testText("<$link to={{from here}} />", options);
	expect(results.fails.length).toEqual(1);
});

it('uses macros for literally unquotable titles', function() {
	var macro = utils.placeholder;
	function link(number) {
		return `<$link to=<<relink-${number||1}>>/>`;
	};
	var to = 'End\'s with "quotes"';
	var to2 = 'Another\'"quotes"';
	var expectedLink = '<$link to=<<relink-1>>/>';
	var r = testText("<$link to='from here'/>", macro(1,to)+link(1), {to: to});
	expect(r.log).toEqual(["%cRenaming 'from here' to '"+to+"' in <$link to /> attribute of tiddler 'test' %cby creating placeholder macros"]);
	testText("Before <$link to='from here'/> After",
	         macro(1,to)+"Before "+link(1)+" After", {to: to});
	// It'll prefer triple-quotes, but it should still resort to macros.
	testText('<$link to="""from here"""/>', macro(1,to)+link(1), {to: to});
	// Only one macro is made, even when multiple instances occur
	testText("<$link to='from here'/><$link to='from here'/>",
		 macro(1,to)+link(1)+link(1), {to: to});
	// If the first placeholder is taken, take the next
	testText(macro(1,to)+link(1)+"<$link to='from here'/>",
	         macro(2,to2)+macro(1,to)+link(1)+link(2), {to: to2});
});

it('detects when internal list uses macros', function() {
	var to = "bad[]name";
	var r = testText("<$list filter='[tag[from here]]'/>",
	                 utils.placeholder(1,to)+"<$list filter='[tag<relink-1>]'/>",
	                 {to: to});
	expect(r.log).toEqual(["%cRenaming 'from here' to '"+to+"' in <$list filter /> attribute of tiddler 'test' %cby creating placeholder macros"]);
});

it('ignores blank attribute configurations', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(attrConf("$transclude", "tiddler", ""));
	testText(`<$link to="A" /><$transclude tiddler="A" />`,
	         `<$link to="to there" /><$transclude tiddler="A" />`,
	         {wiki: wiki, from: "A"});
});

it('ignores unrecognized attribute configurations', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(attrConf("$transclude", "tiddler", "kablam"));
	testText(`<$link to="A" /><$transclude tiddler="A" />`,
	         `<$link to="to there" /><$transclude tiddler="A" />`,
	         {wiki: wiki, from: "A"});
});

/**This is legacy support. The 'title' field type used to be called 'field'
 * But field didn't make sense in many contexts.
 */
it('supports "field" attribute configuration', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(attrConf("$transclude", "tiddler", "field"));
	testText(`<$transclude tiddler="from here" />`, {wiki: wiki});
});

it('filter attributes', function() {
	var prefix = "$:/config/flibbles/relink/";
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		attrConf("$list", "filter", "filter"),
		{title: prefix + "operators/title", text: "yes"}
	]);
	testText(`<$list filter="A [[from here]] B" />`, {wiki: wiki});
	testText(`<$list nothing="A [[from here]] B" />`, {wiki: wiki, ignored: true});
});

});
