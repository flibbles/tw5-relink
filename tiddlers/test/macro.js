/*\

Tests macros.

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
		utils.macroConf("test", "Btitle"),
		utils.macroConf("test", "Clist", "list"),
		utils.macroConf("test", "Dref", "reference"),
		utils.macroConf("test", "Ewiki", "wikitext"),
		utils.attrConf("$link", "to", "title"),
		Object.assign({title: 'test', text: text}, options.fields),
		{title: "testMacro", tags: "$:/tags/Macro",
		 text: "\\define test(A, Btitle, Clist, Dref, Ewiki) stuff\n"}
	]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	utils.failures.calls.reset();
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
	expect(utils.failures).toHaveBeenCalledTimes(options.fails || 0);
};

function getText(wiki, title) {
	return wiki.getTiddler(title).fields.text;
};

describe("macro", function() {

beforeEach(function() {
	spyOn(console, 'log');
	utils.spyFailures(spyOn);
});

it('argument orders', function() {
	testText("Macro <<test stuff 'from here' '[[from here]]' 'from here!!f'>>.", true,
	         ['<<test Btitle>>', '<<test Clist>>', '<<test Dref: "!!f">>']);
	testText("Macro <<test stuff Clist:'[[from here]]' 'from here'>>.", true,
	         ['<<test Btitle>>', '<<test Clist>>']);
	testText("Macro <<test Btitle:'from here' stuff '[[from here]]'>>.", true,
	         ['<<test Btitle>>', '<<test Clist>>']);
	testText("Macro <<test Dref:'from here!!f' stuff 'from here'>>.", true,
	         ['<<test Btitle>>', '<<test Dref: "!!f">>']);
	testText("Macro <<test Clist:'[[from here]]' stuff 'from here'>>.", true,
	         ['<<test Btitle>>', '<<test Clist>>']);
	testText("Macro <<test Dref:'from here!!f' Clist:'[[from here]]' stuff 'from here'>>.", true,
	         ['<<test Btitle>>', '<<test Clist>>', '<<test Dref: "!!f">>']);
	testText("Macro <<test Ewiki: 'a [[from here]] b'>>.", true,
	         ['<<test Ewiki: "[[from here]]">>']);
	testText("Macro <<test Ewiki: {{from}}>>.",
	         "Macro <<test Ewiki: '{{to there}}'>>.",
	         ['<<test Ewiki: "{{}}">>'], {from: "from"});
});

it("the '>' character", function() {
	// It's a tricky character. Allowed in some places, but not others
	// Allowed in standalone macrocalls
	testText("Macro <<test stuff My>val>>.", true,
	         ['<<test Btitle>>'], {from: "My>val", to: "to"});
	testText("Macro <<test stuff 'from here'>>.",
	         "Macro <<test stuff 'My>val'>>.",
	         ['<<test Btitle>>'], {to: "My>val"} );
	testText("Macro <<test stuff from>>.", "Macro <<test stuff 'My>val'>>.",
	         ['<<test Btitle>>'], {from: "from", to: "My>val"});
});

it("block or inline", function() {
	// These ensure that trailing newlines are preserved if present
	// These are really tests that inline and block rules both work
	// in their own ways.
	testText("<<test stuff 'from here'>>\nOther text", true, ['<<test Btitle>>']);
	testText("<<test stuff 'from here'>>\r\nOther text", true, ['<<test Btitle>>']);
	testText("<<test stuff 'from here'>> Other text", true, ['<<test Btitle>>']);
});

it("doesn't choke if attribute string == macro name", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("jsontiddlers", "filter", "filter"),
		utils.operatorConf("title")]);
	testText("<<jsontiddlers jsontiddlers>>", "<<jsontiddlers to>>",
	         ['<<jsontiddlers filter>>'],
	         {wiki: wiki, from: "jsontiddlers", to: "to"});
});

it('core javascript macros', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("jsontiddlers", "filter", "filter"),
		utils.macroConf("testmodulemacro", "param", "filter"),
		utils.operatorConf("title")]);
	testText("<<jsontiddlers '[title[from here]]'>>", true,
	         ['<<jsontiddlers filter>>'], {wiki: wiki});
	// look in macro-module.js for the custom macro module we're calling
	testText("<<testmodulemacro '[title[from here]]'>>", true,
	         ['<<testmodulemacro param>>'], {wiki: wiki});
});

it('whitespace', function() {
	testText("Macro <<test\n  d\n  'from here'\n  '[[from here]]'\n>>.", true,
	         ['<<test Btitle>>', '<<test Clist>>']);
	testText("<<test\r\nd\r\n'from here'\r\n'[[from here]]'\r\n>>\r\n", true,
	         ['<<test Btitle>>', '<<test Clist>>']);
	testText("Macro <<test Clist   :   '[[from here]]'>>.", true,
	         ['<<test Clist>>']);
	testText("Macro\n\n<<test stuff 'from here' '[[from here]]'>>\n\n", true,
	         ['<<test Btitle>>', '<<test Clist>>']);
});

it('quotation for new value', function() {
	function test(value, quotedOut) {
		testText("<<test Btitle:from>>",
		         "<<test Btitle:"+quotedOut+">>",
		         ['<<test Btitle>>'],
		         {from: "from", to: value});
	};
	test("cd", "cd");
	test("c\"\"' ]d", `"""c\"\"' ]d"""`);
	test('c"""\' d', '[[c"""\' d]]');
	test('c"""\' d', '[[c"""\' d]]');
	test('c""" ]d', '\'c""" ]d\'');
});

it('quotation of originalValue', function() {
	testText("<<test Btitle:'from here'>>", true, ['<<test Btitle>>']);
	testText("<<test Btitle:[[from here]]>>", true, ['<<test Btitle>>']);
	testText('<<test Btitle:"from here">>', true, ['<<test Btitle>>']);
	testText('<<test Btitle:from>>', true, ['<<test Btitle>>'], {from: "from", to: "to"});
	testText("<<test Btitle:from>>", "<<test Btitle:'to there'>>", ['<<test Btitle>>'], {from: "from"});
	testText("<<test Btitle:    from    >>", true, ['<<test Btitle>>'], {from: "from", to: "to"});
	testText('<<test Btitle:"""from here""">>', true, ['<<test Btitle>>']);
	// Trick title. Old param parser choked on this.
	testText('<<test Btitle:from]] >>', true, ['<<test Btitle>>'], {from: "from]]", to: "tothere"});
	// Doesn't use quotes when slashes present. This is important to me.
	testText('<<test Btitle:from/here>>', true, ['<<test Btitle>>'], {from: "from/here", to: "to/there"});
	// they allow unquoted '<' as well, while attributes don't
	testText('<<test Btitle:from>>', true, ['<<test Btitle>>'], {from: "from", to: "to<there"});
	// Colons are not allowed to be unquoted
	testText('<<test x from>>', "<<test x 'to:there'>>", ['<<test Btitle>>'], {from: "from", to: "to:there"});
	// but = is allowed
	testText('<<test x from>>', true, ['<<test Btitle>>'], {from: "from", to: "to=there"});
});

it('unquotable titles', function() {
	var to = `to''[]there"`;
	testText("Macro <<test stuff 'from here'>>.",
	         "Macro <$macrocall $name=test A=stuff Btitle=`"+to+"`/>.",
	         ['<<test Btitle>>'], {to: to});
	testText("<$link to=<<test stuff 'from here'>> />", false,
	         ['<$link to=<<test Btitle>> />'], {fails: 1, to: to});
	// This one is tricky because an unrelated attribute can't be quoted
	// the way it was in a macro invocation
	testText('X<<test A:g>t "from here">>Y',
	         "X<$macrocall $name=test A='g>t' Btitle=`"+to+"`/>Y",
	         ['<<test Btitle>>'], {to: to});
	// Even if the toTitle is okay. It can make a list unquotable
	var apos = "M[]'s";
	testText('X<<test Clist: \'[[from here]] C"\'>>Y',
	         'X<$macrocall $name=test Clist=`'+apos+' C"`/>Y',
	         ['<<test Clist>>'], {to: apos});
	// Without backtics, we'd even have to fail
	testText('X<<test Clist: \'[[from here]] C"\'>>Y', false,
	         ['<<test Clist>>'], {to: "```"+apos, fails: 1});
	// Empty attributes remain, but should be quoted
	testText('<<test Clist: "" Btitle:"from here">>',
	         "<$macrocall $name=test Clist='' Btitle=`"+to+"`/>",
	         ['<<test Btitle>>'], {to: to});
});

it('unquotable wikitext', function() {
	// wikitext fails when it's too complicated.
	var to = "' ``` ]]}}\"";
	testText("X<<test Ewiki: 'T <$link to=\"from here\" />'>>", false,
	         ['<<test Ewiki: "<$link to />">>'], {to: to, fails: 1});

	// but wikitext will still be wrapped if it can
	to = "' ``` \"}}"; // This can be wrapped in triple-quotes
	testText("X<<test Ewiki: 'T <$link to=\"from here\" />'>>",
	         'X<<test Ewiki: [[T <$link to="""'+to+'""" />]]>>',
	         ['<<test Ewiki: "<$link to />">>'], {to: to});

	// Will downgrade to a widget if necessary
	to = "' \"]]}}"; // This can be wrapped in triple-quotes
	testText("X<<test Ewiki: 'T <$link to=\"from here\" />'>>",
	         'X<$macrocall $name=test Ewiki=`T <$link to="""'+to+'""" />`/>',
	         ['<<test Ewiki: "<$link to />">>'], {to: to});
});

it('respects \\rules', function() {
	testText("\\rules only macrocallinline\n<<test Btitle:'from here'>>", true,
	         ['<<test Btitle>>']);
	testText("\\rules only macrocallblock\n<<test Btitle:'from here'>>", true,
	         ['<<test Btitle>>']);
	testText("\\rules only html macrodef\n<<test Btitle:'from here'>>", false);
	testText("\\rules except macrocallinline macrocallblock\n<<test Btitle:'from here'>>", false);

	// downgrading to widget
	var to = `to''[]there"`;
	testText("\\rules except html\n<<test Btitle:'from here'>>", false,
	         ['<<test Btitle>>'],
	         {to: to, fails: 1});
});

it('undefined macros', function() {
	// Relink will try it's best to tolerate macro settings that have
	// no coreesponding macro definition, but it'll fail if there's a
	// chance it's not relinking when it should.
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("undef", "param", "title"));
	// This in theory doesn't have to fail if it's willing to experiment
	// with the anonymous parameters to see if any WOULD be altered.
	testText("<<undef something>> [[from here]]", true, ['[[from here]]'], {wiki: wiki, fails: 1});
	testText("<<undef param:'from here'>>", true, ['<<undef param>>'], {wiki: wiki});
	testText("<<undef A B C D param:'from here'>>", true, ['<<undef param>>'], {wiki: wiki});
	testText("<<undef 'from here'>>", false, undefined, {wiki: wiki, fails: 1});
	var to = `to''[]there"`;
	testText("<<undef param:'from here'>>",
	         "<$macrocall $name=undef param=`"+to+"`/>",
	         ['<<undef param>>'], {wiki: wiki, to: to});
	// Relink CAN resolve the argument, since it's named, but it needs to
	// convert into a widget, which it can't do unless ALL arguments can
	// be named (which you can't do without the macro definition).
	testText("<<undef something param:'from here'>> [[from here]]",
	         "<<undef something param:'from here'>> [[A] '\"]]",
	         ['<<undef param>>', '[[from here]]'],
	         {wiki: wiki, to: "A] '\"", fails: 1});
	// Relink should realize that there's nothing to do on this one and
	// not emit an error. param is already spoken for, so that undefined
	// param is irrelevant.
	testText("<<undef 'from here' param: unrelated>> from here", false,
	         undefined, {wiki: wiki, fails: 0})
});

it("undefined macros, multiple active parameters", function() {
	var to = 'to\'\'[]there"';
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("undef", "param", "title"),
		utils.macroConf("undef", "list", "list")]);

	// Relink continues if one param couldn't resolve. Others might.
	testText("<<undef 'from here' param:'from here'>>",
	         "<<undef 'from here' param:'to there'>>",
	         ['<<undef param>>'],
	         {wiki: wiki, fails: 1});

	// Two failures, one can't be resolved. The other needs to downgrade
	// into a widget, but it can't because an unnamed parameter can't be
	// resolved.
	testText("<<undef 'from here' param:'from here'>>",
	         "<<undef 'from here' param:'from here'>>",
	         ['<<undef param>>'],
	         {wiki: wiki, fails: 1, to: to});

	// Super tricky. Both parameters can relink, but 'param' requires a
	// downgrade. But there's an unresolved anonymous param, so no
	// downgrade possible. Therefore, fail that, but process the other.
	testText("<<undef list:'[[from]]' param:'from' anon>> [[from]]",
	         `<<undef list:"""[[A] '\"]]""" param:'from' anon>> [[A] '\"]]`,
	         ['<<undef list>>', '<<undef param>>', '[[from]]'],
	         {wiki: wiki, fails: 1, from: "from", to: "A] '\""});
});

it('undefined macros, no anonymous params', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("undef", "A"));
	wiki.addTiddler(utils.macroConf("undef", "B"));

	// Relink should not find B, and that should be okay. Because there
	// aren't any anonymous parameters, so B can't be there, despite
	// there being no definition.
	testText("<<undef A:'from here'>>", true, ['<<undef A>>'], {wiki: wiki});
});

it('imported macros', function() {
	function test(text, expected, report, options) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			utils.operatorConf("title"),
			utils.macroConf("other", "param", "title"),
			utils.macroConf("ptr", "tiddler", "title"),
			utils.attrConf("$importvariables", "filter", "filter"),
			{title: "otherTiddler", text: "\\define other(A, param) X\n"},
			{title: "ptr", tags: "$:/tags/Macro", text: "\\define ptr(tiddler) $tiddler$\n"},
			{title: "otherRef", pointer: "otherTiddler"},
			{title: "newTest", text: "\\define test(Dref) X\n"}
		]);
		options = Object.assign({wiki: wiki}, options);
		testText(text, expected, report, options);
	};
	test("\\import otherTiddler\n\n<<other Z [[from here]]>>", true, ['<<other param>>']);
	test("<$importvariables filter='A otherTiddler B'><<other Z [[from here]]>></$importvariables>", true, ['<<other param>>']);
	test("<$importvariables filter={{otherRef!!pointer}}><<other Z [[from here]]>></$importvariables>", true, ['<<other param>>']);
	test("<$importvariables filter={{{[all[current]get[pointer]]}}}><<other Z [[from here]]>></$importvariables>", true, ['<<other param>>'], {fields: {pointer: "otherTiddler"}});
	test("<$importvariables filter={{!!pointer}}><<other Z [[from here]]>></$importvariables>", true, ['<<other param>>'], {fields: {pointer: "otherTiddler"}});
	test("<$importvariables filter=<<ptr otherTiddler>>><<other Z [[from here]]>></$importvariables>", true, ['<<other param>>']);
	// If macro not imported. Arguments aren't resolved
	test("<<other Z [[from here]]>>", false, undefined, {fails: 1});
	// But arguments can be resolved anyway if they're named
	test("<<other Z param:[[from here]]>>", true, ['<<other param>>']);
	//imported takes priority over global
	test("\\import newTest\n\n<<test 'from here##index'>>", true,
	     ['<<test Dref: "##index">>']);
	test("<$importvariables filter=newTest><<test 'from here##index'>></$importvariables>", true, ['<<test Dref: "##index">>']);
	//imported doesn't take priority if it's not imported though
	test("<<test Z 'from here'>>", true, ['<<test Btitle>>']);
	//And importing something else doesn't goof up the lookup chain
	test("\\import otherTiddler\n\n<<test Z 'from here'>>", true, ['<<test Btitle>>']);
	test("<$importvariables filter='otherTiddler'>\n\n<<test Z 'from here'>>\n\n</$importvariables>", true, ['<<test Btitle>>']);

	// These are for when the importvariables needs updating before it
	// can be referenced. A rare scenario, but it could happen.
	test("\\import otherTiddler\n\n<<other Z otherTiddler>>", true,
	     ['\\import', '<<other param>>'], {from: "otherTiddler", to: "tothere"});
	test("<$importvariables filter='otherTiddler'><<other Z otherTiddler>></$importvariables>", true,
	     ['<$importvariables filter />', '<<other param>>'], {from: "otherTiddler", to: "toThereAgain"});
	test("<$importvariables filter={{otherRef!!pointer}}><<other Z otherRef>></$importvariables>", true,
	     ['<$importvariables filter={{!!pointer}} />', '<<other param>>'], {from: "otherRef", to: "toThereAgain"});
	test("<$importvariables filter=<<ptr otherTiddler>>><<other Z otherTiddler>></$importvariables>", true,
	     ['<$importvariables filter=<<ptr tiddler>> />', '<<other param>>'], {from: "otherTiddler", to: "toThereAgain"});
	test("<$importvariables filter={{{otherRef +[get[pointer]]}}}><<other Z otherRef>></$importvariables>", true,
	     ['<$importvariables filter={{{}}} />', '<<other param>>'], {from: "otherRef", to: "toThereAgain"});
});

it('local macros simple', function() {
	function test(text, expected, report, options) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			utils.macroConf("method", "Btitle", "title")
		]);
		options = Object.assign({wiki: wiki}, options);
		testText(text, expected, report, options);
	};
	test("\\define method(A, Btitle, C) stuff\n\n<<method X 'from here'>>",true,
	     ['<<method Btitle>>']);
	// Can override existing macros
	test("\\define test(Dref) stuff\n\n<<test 'from here##index'>>", true,
	     ['<<test Dref: "##index">>']);
});

(utils.atLeastVersion('5.2.0') ? it : xit)('macros in nested wikitext', function() {
	// The `text` parameter uses a different wikiparser than the one
	// parsing the tiddler. That parser might not have access to definitions
	// in the tiddler, but it should.
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("outer", "text", "wikitext"),
		utils.macroConf("inner", "title", "title")]);
	testText('\\define inner(title) content\n<<outer text:"""<<inner "from here">>""" >>', true, ['<<outer text: "<<inner title>>">>'], {wiki: wiki});
	testText('\\define inner(title) content\n<$macrocall $name=outer text=<<inner "from here">> />', true,
	         ['<$macrocall text=<<inner title>> />'], {wiki: wiki});
	testText('\\define inner(title) content\n<$macrocall $name=outer text="""<<inner "from here">>""" />', true,
	         ['<<outer text="<<inner title>>" />'], {wiki: wiki});
});

it('slashes in macro name', function() {
	// non/attr is a legal macro name, but not a legal
	// unquoted attribute
	// Also, it might goof up our settings system
	var wiki = new $tw.Wiki();
	var to = 'to\'\'[]there"';
	wiki.addTiddler(utils.macroConf("non/attr", "param", "title"));
	testText('X<<non/attr param:"from here">>Y',
	         "X<$macrocall $name='non/attr' param=`"+to+"`/>Y",
	         ['<<non/attr param>>'], {to: to, wiki: wiki});
});

it('empty or undefined macro params', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("macro", "param"));
	testText("\\define macro(other, param) C\n<<macro '' 'from here'>>", true,
	         ['<<macro param>>'], {wiki: wiki});
});

it('$macrocall', function() {
	testText("<$macrocall $name=test A=stuff Btitle='from here' Clist='[[from here]]' Dref='from here##index' />", true,
	         ['<<test Btitle />', '<<test Clist />', '<<test Dref="##index" />']);
	testText("\n\n<$macrocall $name=test\n\nBtitle='from here'/>\n\n", true,
	         ['<<test Btitle />']);

	// not having $name shouldn't cause a crash
	testText("<$macrocall Btitle='from here' />", false, undefined);
	// unmanaged macros shouldn't cause problems either
	testText("<$macrocall $name=none value='from here' />", false, undefined);
	// leaves other attributes alone
	// Unreported Issue: Relink would change unrelated macro parameters too.
	// if they came after something that got relinked.
	testText("<$macrocall $name=test Btitle='from here' other=<<anything>> />", true, ['<<test Btitle />']);
});

it('$macrocall impossibles', function() {
	testText("<$macrocall $name=test Clist=from />",
	         "<$macrocall $name=test Clist=from />",
	         ['<<test Clist />'],
	         {from: "from", to: "t ]] o", fails: 1});
	testText("<$macrocall $name=test Clist=from Btitle=from />",
	         "<$macrocall $name=test Clist=from Btitle='t ]] o' />",
	         ['<<test Clist />', '<<test Btitle />'],
	         {from: "from", to: "t ]] o", fails: 1});
});

(utils.atLeastVersion('5.3.0') ? it : xit)('$transclude', function() {
	testText("<$transclude $variable=test A=stuff Btitle='from here' Clist='[[from here]]' Dref='from here##index' />", true,
	         ['<<test Btitle />', '<<test Clist />', '<<test Dref="##index" />']);
	// not having $name shouldn't cause a crash
	testText("<$transclude Btitle='from here' />", false, undefined);
	// unmanaged macros shouldn't cause problems either
	testText("<$transclude $variable=none value='from here' />", false, undefined);
	// leaves other attributes alone
	// Unreported Issue: Relink would change unrelated macro parameters too.
	// if they came after something that got relinked.
	testText("<$transclude $variable=test Btitle='from here' other=<<anything>> />", true, ['<<test Btitle />']);
});

(utils.atLeastVersion('5.3.0') ? it : xit)('$transclude and $reserved attributes', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf("test", "$title"),
		utils.macroConf("test", "$mode"),
		{title: "testMacro", tags: "$:/tags/Macro",
		 text: "\\procedure test($title, $mode) stuff\n"}]);
	testText("<$transclude $variable=test $$title='from here' />", true, ['<<test $title />'], {wiki: wiki});
	testText("<$transclude $variable=test $title='from here' />", false, undefined, {wiki: wiki});
	testText("<$transclude $variable=test title='from here' />", false, undefined, {wiki: wiki});
	testText("<$transclude $variable=test $$mode='from here' />", true, ['<<test $mode />'], {wiki: wiki});
	testText("<$transclude $variable=test $mode='from here' />", false, undefined, {wiki: wiki});
});
(utils.atLeastVersion('5.3.0') ? it : xit)('$transclude impossibles', function() {
	testText("<$transclude $variable=test Clist=from />",
	         "<$transclude $variable=test Clist=from />",
	         ['<<test Clist />'],
	         {from: "from", to: "t ]] o", fails: 1});
	testText("<$transclude $variable=test Clist=from Btitle=from />",
	         "<$transclude $variable=test Clist=from Btitle='t ]] o' />",
	         ['<<test Clist />', '<<test Btitle />'],
	         {from: "from", to: "t ]] o", fails: 1});
});

it('attribute invocations', function() {
	testText("Before <$a b=<<test stuff 'from here'>>/> After", true,
	         ['<$a b=<<test Btitle>> />']);
	testText("Before <$a b   =    <<test stuff 'from here'>> /> After", true,
	         ['<$a b=<<test Btitle>> />']);
	testText("Before <$a b\n=\n<<test stuff 'from here'>>\n/> After", true,
	         ['<$a b=<<test Btitle>> />']);
});

it('keeps up to date with macro changes', async function() {
	var wiki = new $tw.Wiki();
	var t = testText("Macro <<test stuff 'from here'>>.", true,
	                 ['<<test Btitle>>'], {wiki: wiki});
	wiki.addTiddler({ title: "testMacro", tags: "$:/tags/Macro",
		text: "\\define test(Btitle) title is first now\n"});
	await utils.flush();

	// Btitle is the first argument now. Relink should realize that.
	// DON'T USE testText, because that'll reoverwrite the new testMacro
	t = utils.relink({text: "Macro <<test 'from here'>>."}, {wiki: wiki});
	expect(t.tiddler.fields.text).toEqual("Macro <<test 'to there'>>.");
});

it('does not bleed local contexts into other tiddlers', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.macroConf('macro', 'A'),
		{title: '1', text: '\\relink macro B\n<<macro B:from>>'},
		{title: '2', text: '<<macro A:from B:from>>'},
		{title: '3', text: '\\relink macro B\n<<macro B:from>>'}
	]);
	expect(utils.getReport('2', wiki)).toEqual({from: ['<<macro A>>']});
	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, '1')).toBe('\\relink macro B\n<<macro B:to>>');
	expect(getText(wiki, '2')).toBe('<<macro A:to B:from>>');
	expect(getText(wiki, '3')).toBe('\\relink macro B\n<<macro B:to>>');
});

});
