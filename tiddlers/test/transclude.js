/*\

Tests transcludes.

\*/

var utils = require("test/utils");

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

describe("transcludes", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('transcludes', function() {
	testText("{{from here}}", true, ['{{}}'], {to: "to"});
	testText("Before {{from here}} After", true, ['{{}}']);
	testText("Before {{from here!!field}} After", true, ['{{!!field}}']);
	testText("Before {{from here##index}} After", true, ['{{##index}}']);
	testText("Before {{from here||template}} After", true, ['{{||template}}']);
	testText("Before {{title||from here}} After", true, ['{{title||}}']);
	testText("Before {{||from here}} After", true, ['{{||}}']);
	testText("Before {{from here||from here}} After", true, ['{{||from here}}', '{{from here||}}']);
	testText("Before\n\n{{from here||template}}\n\nAfter", true, ['{{||template}}'])
	testText("Before\r\n{{from here||template}}\r\nAfter", true, ['{{||template}}'])
	//These ones don't make much sense, but we'll support them.
	testText("Before {{from here!!field||template}} After", true, ['{{!!field||template}}']);
	testText("Before {{from here##index||template}} After", true, ['{{##index||template}}']);
	testText("Before {{title!!field||from here}} After", true, ['{{title!!field||}}']);
	testText("Before {{title##index||from here}} After", true, ['{{title##index||}}']);
	testText("{{from here}}", true, ['{{}}'], {to: "to!there"});
	testText("{{from here}}", true, ['{{}}'], {to: "to#there"});
	//Templates can have ## and !! even though the title cannot
	testText("{{title||from here}}", true, ['{{title||}}'], {to: "to!!there"});
	testText("{{title||from here}}", true, ['{{title||}}'], {to: "to##there"});
});


it('default', function() {
	const wiki = new $tw.Wiki();
	const text =  'Empty: {{}} Fields: {{!!field}} Index: {{##index}} End';
	wiki.addTiddler({title: 'test', text: text});
	expect(utils.getReport('test', wiki)).toEqual({});
	wiki.renameTiddler('', 'anything');
	expect(utils.getText('test', wiki)).toEqual(text);
});

it('preserves pretty whitespace', function() {
	testText("Before {{  from here  }} After", true, ['{{}}']);
	testText("Before {{\nfrom here\n}} After", true, ['{{}}']);
	testText("Before {{\n\nfrom here!!field\n\n}} After", true, ['{{!!field}}']);
	testText("Before {{  from here  ||  from here  }} After", true, ['{{||from here}}', '{{from here||}}']);
	testText("{{tiddler||from here\n\n}}", true, ['{{tiddler||}}']);
	testText("Before {{  from here!!field  ||  from here  }} After", true, ['{{!!field||from here}}', '{{from here!!field||}}']);
	testText("Before {{  from here##index  ||  from here  }} After", true, ['{{##index||from here}}', '{{from here##index||}}']);
	testText("Before {{||  from here  }} After", true, ['{{||}}']);
});

it('tricky syntax', function() {
	// our own textReference parser used to choke on these instances
	testText("{{from!!}}", true, ['{{}}'], {from: 'from!!'});
	testText("{{ from!! }}", true, ['{{}}'], {from: 'from!!'});
	testText("{{ from!!\n}}", true, ['{{}}'], {from: 'from!!'});
	testText("{{from##}}", true, ['{{}}'], {from: 'from##'});
	testText("{{ from## }}", true, ['{{}}'], {from: 'from##'});
	testText("{{ from##\n}}", true, ['{{}}'], {from: 'from##'});
});

it('from titles with curlies', function() {
	// Despite a block rule theoretically being able to parse this,
	// (like it can with filteredtransclude), it doesn't. That's becase
	// the regexp used by the rule disallows ANY '}' no matter what.
	testText("{{has{curls}}}", false, undefined, {from: "has{curls}"});
	testText("{{has{curls}}} inline", false, undefined, {from: "has{curls}"});
});

it('ignores malformed transcludes', function() {
	testText("{{from here||}}", false, undefined);
});

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("{{from here}}.",
		         "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>.",
		         ['{{}}'],
		         {to: to});
	};
	testUnpretty("has { curly");
	testUnpretty("has !! bangs");
	testUnpretty("has ## hashes");
	testUnpretty("other } curly");
	testUnpretty("bar | bar");
});

it('unpretty (degrades to widget)', function() {
	const to = "curly {}";
	const wiki = new $tw.Wiki();
	const options = {to: to, wiki: wiki};
	wiki.addTiddlers([
		utils.attrConf('$tiddler', 'tiddler'),
		utils.attrConf('$transclude', 'template')]);
	testText("{{from here}}.", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>.", ['{{}}'], options);
	testText("{{||from here}}.", "<$transclude tiddler='"+to+"'/>.", ['{{||}}'], options);
	testText("{{other title||from here}}.", "<$tiddler tiddler='other title'><$transclude tiddler='"+to+"'/></$tiddler>.", ['{{other title||}}'], options);
	testText("{{from here||Template}}.", "<$tiddler tiddler='"+to+"'>{{||Template}}</$tiddler>.", ['{{||Template}}'], options);
	testText("{{from here!!field}}.", "<$tiddler tiddler='"+to+"'>{{!!field}}</$tiddler>.", ['{{!!field}}'], options);
	testText("{{from here##index}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.", ['{{##index}}'], options);
	// I don't know why anyone would do these, but Relink will manage it.
	testText("{{from here!!field||Template}}.", "<$tiddler tiddler='"+to+"'>{{!!field||Template}}</$tiddler>.", ['{{!!field||Template}}'], options);
	testText("{{from here##index||Template}}.", "<$tiddler tiddler='"+to+"'>{{##index||Template}}</$tiddler>.", ['{{##index||Template}}'], options);
	testText("{{from here||from here}}.", "<$tiddler tiddler='"+to+"'><$transclude tiddler='"+to+"'/></$tiddler>.", ['{{||from here}}', '{{from here||}}'], options);

	// preserves block newline whitespace
	testText("{{from here}}\nTxt", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>\nTxt", ['{{}}'], options);
	testText("{{from here}}\r\nTxt", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>\r\nTxt", ['{{}}'], options);
});

it('respects \\rules', function() {
	testText("\\rules only transcludeinline\n{{from here}}", true, ['{{}}']);
	testText("\\rules only transcludeblock\n{{from here}}", true, ['{{}}']);
	testText("\\rules only html\n{{from here}}", false, undefined);

	function fails(to, text, expected, report) {
		const fails = utils.collectFailures(function() {
			testText(text, expected, report, {to: to, macrodefCanBeDisabled: true});
		});
		expect(fails.length).toEqual(1);
	};
	fails("curly {}", "\\rules except html\n{{from here}}", false, ['{{}}']);
	fails("curly {}", "\\rules except html\n{{||from here}}", false, ['{{||}}']);
	fails("curly {}", "\\rules except html\n{{from here||template}}", false, ['{{||template}}']);
	// Tries to placeholder
	var to = "{}' \"";
	fails(to, "\\rules except html\n{{from here}} [[from here]]",
	          "\\rules except html\n{{from here}} [["+to+"]]",
	          ['{{}}', '[[from here]]']);
	fails(to, "\\rules except html\n{{||from here}} [[from here]]",
	          "\\rules except html\n{{||from here}} [["+to+"]]",
	          ['{{||}}', '[[from here]]']);
	fails(to, "\\rules except macrodef\n{{from here}}", false, ['{{}}']);
	fails(to, "\\rules except macrodef\n{{||from here}}", false, ['{{||}}']);
});

it('unpretty, but the title is unquotable', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$tiddler', 'tiddler'));
	var to = "curly {}";
	var other = "a'\"";
	testText("{{"+other+"||from here}}.", utils.placeholder(1,other)+"<$tiddler tiddler=<<relink-1>>><$transclude tiddler='"+to+"'/></$tiddler>.", ['{{'+other+'||}}'], {to: to, wiki: wiki});
});

it('unpretty and unquotable', function() {
	var to = "has {curly} 'apos' \"quotes\"";
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.attrConf('$tiddler', 'tiddler'),
		utils.attrConf('$transclude', 'tiddler')]);
	const options = {to: to, wiki: wiki};
	testText("{{from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{}}</$tiddler>.", ['{{}}'], options);
	testText("{{||from here}}.", utils.placeholder(1,to)+"<$transclude tiddler=<<relink-1>>/>.", ['{{||}}'], options);
	testText("{{from here||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{||Template}}</$tiddler>.", ['{{||Template}}'], options);
	testText("{{from here!!field}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{!!field}}</$tiddler>.", ['{{!!field}}'], options);
	testText("{{from here##index}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{##index}}</$tiddler>.", ['{{##index}}'], options);
	// Strange nonsense syntax we support
	testText("{{from here||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>><$transclude tiddler=<<relink-1>>/></$tiddler>.", ['{{||from here}}', '{{from here||}}'], options);
	testText("{{from here!!field||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{!!field||Template}}</$tiddler>.", ['{{!!field||Template}}'], options);
	testText("{{from here##index||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{##index||Template}}</$tiddler>.", ['{{##index||Template}}'], options);
	testText("{{title##index||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> index=index/></$tiddler>.", ['{{title##index||}}'], options);
	testText("{{title!!field||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> field=field/></$tiddler>.", ['{{title!!field||}}'], options);
	var other = "a'\"";
	var index = "'apos' and \"quotes\"";
	// Double placeholder insanity. What kind of
	// sick pervert names their tiddlers like this?
	testText("{{  a'\"  ||  from here  }}.", utils.placeholder(1,to)+utils.placeholder(2,other)+"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>>/></$tiddler>.", ['{{'+other+'||}}'], options);
	testText("{{from here|| a'\"  }}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{|| a'\"  }}</$tiddler>.", ['{{||'+other+'}}'], options);
	// This case is so preposterous, I'm not sure I even want to cover it.
	testText("{{  "+other+"##"+index+"||from here  }}.", utils.placeholder(1,to)+utils.placeholder(2,other)+utils.placeholder("plaintext-1",index)+"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>> index=<<relink-plaintext-1>>/></$tiddler>.", ['{{'+other+'##'+index+'||}}'], options);
});

it('transclude differentiates between inline and block', function() {
	var block =  "{{from here}}";
	var inline = "Inline {{from here}} inline";
	testText("\\rules except transcludeinline\n"+inline, false, undefined);
	testText("\\rules except transcludeblock\n"+inline, true, ['{{}}']);
	testText("\\rules except transcludeinline\n"+block, true, ['{{}}']);
	testText("\\rules except transcludeblock\n"+block, true, ['{{}}']);
	testText("\\rules except transcludeinline transcludeblock\n"+block, false, undefined);
});

});
