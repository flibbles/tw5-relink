/*\

Tests transcludes.

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

(utils.atLeastVersion("5.3.0")? it: xit)('parameters', function() {
	testText("{{from here|param}}", true, ['{{|param}}']);
	testText("{{from here||template|param}}", true, ['{{||template|param}}']);
	testText("{{from here!!text||template|param}}", true, ['{{!!text||template|param}}']);
	testText("{{tiddler!!text||from here|param}}", true, ['{{tiddler!!text|||param}}']);
	const to = "curly {}";
	testText("{{from here##index||Template|param}}.", "<$tiddler tiddler='"+to+"'>{{##index||Template|param}}</$tiddler>.", ['{{##index||Template|param}}'], {to: to});
	testText("{{from here##index|param}}.", "<$tiddler tiddler='"+to+"'>{{##index|param}}</$tiddler>.", ['{{##index|param}}'], {to: to});
	// TODO: parameters for tiddlers is a thing I need to support
	//testText("{{||from here|param}}.", "<$transclude tiddler='"+to+"' />.", ['{{|||param}}'], {to: to});
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
	testText("{{from here|}}", false, undefined);
});

it('handles placeholders', function() {
	testText('\\define macro(abc) {{$abc$!!title}}', false, undefined, {from: '$abc$'});
	testText('\\define macro(abc) {{tiddler||$abc$}}', false, undefined, {from: '$abc$'});
	utils.spyFailures(spyOn);
	testText('\\define macro(abc) {{from here!!title}}', false, ['\\define macro() {{!!title}}'], {to: '$abc$'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText('\\define macro(abc) {{tiddler||from here}}', false, ['\\define macro() {{tiddler||}}'], {to: '$abc$'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
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

	utils.spyFailures(spyOn);
	function fails(to, text, expected, report) {
		utils.failures.calls.reset();
		testText(text, expected, report, {to: to});
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	fails("curly {}", "\\rules except html\n{{from here}}", false, ['{{}}']);
	fails("curly {}", "\\rules except html\n{{||from here}}", false, ['{{||}}']);
	fails("curly {}", "\\rules except html\n{{from here||template}}", false, ['{{||template}}']);
	var to = "{}' \"";
	fails(to, "\\rules except html\n{{from here}} [[from here]]",
	          "\\rules except html\n{{from here}} [["+to+"]]",
	          ['{{}}', '[[from here]]']);
	fails(to, "\\rules except html\n{{||from here}} [[from here]]",
	          "\\rules except html\n{{||from here}} [["+to+"]]",
	          ['{{||}}', '[[from here]]']);
});

it('unpretty, but the title is unquotable', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$tiddler', 'tiddler'));
	utils.spyFailures(spyOn);
	var to = "curly {}";
	var other = "a```'\"";
	testText("{{"+other+"||from here}}.", false, ['{{'+other+'||}}'], {to: to, wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('unpretty and unquotable', function() {
	var to = "has {curly} ``` 'apos' \"quotes\"";
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.attrConf('$tiddler', 'tiddler'),
		utils.attrConf('$transclude', 'tiddler')]);
	utils.spyFailures(spyOn);
	function testFail(text, report, options) {
		testText(text, false, report, options);
		expect(utils.failures).toHaveBeenCalledTimes(1);
		utils.failures.calls.reset();
	};
	const options = {to: to, wiki: wiki};
	testFail("{{from here}}.", ['{{}}'], options);
	testFail("{{||from here}}.", ['{{||}}'], options);
	testFail("{{from here||Template}}.", ['{{||Template}}'], options);
	testFail("{{from here!!field}}.", ['{{!!field}}'], options);
	testFail("{{from here##index}}.", ['{{##index}}'], options);
	// Strange nonsense syntax we support
	testFail("{{from here||from here}}.", ['{{||from here}}', '{{from here||}}'], options);
	testFail("{{from here!!field||Template}}.", ['{{!!field||Template}}'], options);
	testFail("{{from here##index||Template}}.", ['{{##index||Template}}'], options);
	testFail("{{title##index||from here}}.", ['{{title##index||}}'], options);
	testFail("{{title!!field||from here}}.", ['{{title!!field||}}'], options);
	var other = "a```'\"";
	var index = "'apos' ``` and \"quotes\"";
	testFail("{{  "+other+"  ||  from here  }}.", ['{{'+other+'||}}'], options);
	testFail("{{from here|| "+other+"  }}.", ['{{||'+other+'}}'], options);
	// This case is so preposterous, I'm not sure I even want to cover it.
	testFail("{{  "+other+"##"+index+"||from here  }}.", ['{{'+other+'##'+index+'||}}'], options);
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
