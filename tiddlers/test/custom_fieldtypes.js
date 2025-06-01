/*\

Tests 3rd party module-types. Like a relinkfieldtype

\*/

var utils = require("./utils");

describe("custom: fieldtypes", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it("can report", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf("dummy", "old-dummy-type"));
	wiki.addTiddler({title: "test", dummy: "from here"});
	expect(utils.getReport('test', wiki)["from here"]).toEqual(["dummy: Dummy", "dummy: dummy"]);
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

it("handles types with newline characters", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('newline', 'reference\n'),
		{title: 'test', newline: 'from here!!field'}]);
	wiki.renameTiddler('from here', 'to there');
	expect(wiki.getTiddler('test').fields.newline).toBe('to there!!field');
});

it("can find titles even if they don't appear as fromTitle", function() {
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
