/*\

Tests 3rd party module-types. Like a relinkfieldtype

\*/

var utils = require("test/utils");

describe("custom: fieldtypes", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it("works with custom fieldtypes", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf("dummy", "dummy-type"));
	var r = utils.relink({dummy: "from here"}, {wiki: wiki});
	expect(r.tiddler.fields.dummy).toEqual("to there");
});

it("works with legacy custom fieldtypes", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf("dummy", "old-dummy-type"));
	var r = utils.relink({dummy: "from here"}, {wiki: wiki});
	expect(r.tiddler.fields.dummy).toEqual("to there");
});

it("has access to fields of conf tiddler", function() {
	var wiki = new $tw.Wiki();
	var conf = utils.fieldConf("dummy", "dummy-type");
	conf.prepend = "Replaced: ";
	wiki.addTiddler(conf);
	var r = utils.relink({dummy: "from here"}, {wiki: wiki});
	expect(r.tiddler.fields.dummy).toEqual("Replaced: to there");
});

it("has access to fields of inline $:/tags/Macro tiddler", function() {
	var wiki = new $tw.Wiki();
	var conf = {title: "global", tags: "$:/tags/Macro", prepend: "XXX: ",
		text: "\\define dummy(field) content\n\\relink dummy field:dummy-type"};
	wiki.addTiddler(conf);
	var r = utils.relink({text: "<<dummy field: 'from here'>>"}, {wiki: wiki});
	expect(r.tiddler.fields.text).toEqual("<<dummy field: 'XXX: to there'>>");
});

it("has access to fields of locally defined macro", function() {
	var r = utils.relink( {
		prepend: "YYY: ",
		text: "\\relink dummy f:dummy-type\n\n<<dummy f: 'from here'>>" });
	expect(r.tiddler.fields.text).toEqual("\\relink dummy f:dummy-type\n\n<<dummy f: 'YYY: to there'>>");
});

it("handles types with newline characters", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('newline', 'reference\n'),
		{title: 'test', newline: 'from here!!field'}]);
	wiki.renameTiddler('from here', 'to there');
	expect(wiki.getTiddler('test').fields.newline).toBe('to there!!field');
});

});

describe("custom: surveyors", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('uses custom surveyors', function() {
	var wiki = new $tw.Wiki(),
		r;
	wiki.addTiddlers([
		utils.macroConf("macro", "dummy", "dummy-type"),
		utils.attrConf("$elem", "dummy", "dummy-type"),
		utils.operatorConf("dummy", "dummy-type")]);
	r = utils.relink({text: "<$elem dummy='FROM HERE' />"}, {wiki: wiki});
	expect(r.tiddler.fields.text).toEqual("<$elem dummy='to there' />");
	r = utils.relink({text: "<<macro dummy: 'FROM HERE' >>"}, {wiki: wiki});
	expect(r.tiddler.fields.text).toEqual("<<macro dummy: 'to there' >>");
	r = utils.relink({text: "{{{ [dummy[FROM HERE]] }}}"}, {wiki: wiki});
	expect(r.tiddler.fields.text).toEqual("{{{ [dummy[to there]] }}}");
});

});
