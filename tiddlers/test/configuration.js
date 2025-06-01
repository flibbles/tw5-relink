/*\

Tests the new relinking wiki methods.

\*/

var utils = require("./utils");

describe('configuration', function() {

it('updates whenever configuration changes', async function() {
	spyOn(console, 'log');
	var wiki = new $tw.Wiki();

	wiki.addTiddler({title: "test", test: "A"});
	await utils.flush();
	wiki.renameTiddler("A", "B");
	expect(wiki.getTiddler("test").fields.test).toEqual("A");

	// Detects additions
	wiki.addTiddler(utils.fieldConf("test", "title"));
	await utils.flush();
	wiki.renameTiddler("A", "B");
	expect(wiki.getTiddler("test").fields.test).toEqual("B");

	// Detects modifications
	wiki.addTiddler({title: "test", test: "B!!F"});
	wiki.addTiddler(utils.fieldConf("test", "reference"));
	await utils.flush();
	wiki.renameTiddler("B", "C");
	expect(wiki.getTiddler("test").fields.test).toEqual("C!!F");

	//Detects deletion
	wiki.addTiddler({title: "test", test: "C!!F"});
	wiki.deleteTiddler(utils.fieldConf("test", "reference").title);
	await utils.flush();
	wiki.renameTiddler("C", "D");
	expect(wiki.getTiddler("test").fields.test).toEqual("C!!F");
});

});
