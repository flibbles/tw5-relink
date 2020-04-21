/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");

describe('configuration', function() {

it('updates whenever configuration changes', function() {
	var wiki = new $tw.Wiki();
	utils.collect("log", function() {
		wiki.addTiddler({title: "test", test: "A"});
		wiki.renameTiddler("A", "B");
		expect(wiki.getTiddler("test").fields.test).toEqual("A");

		// Detects additions
		wiki.addTiddler(utils.fieldConf("test", "title"));
		wiki.renameTiddler("A", "B");
		expect(wiki.getTiddler("test").fields.test).toEqual("B");

		// Detects modifications
		wiki.addTiddler({title: "test", test: "B!!F"});
		wiki.addTiddler(utils.fieldConf("test", "reference"));
		wiki.renameTiddler("B", "C");
		expect(wiki.getTiddler("test").fields.test).toEqual("C!!F");

		//Detects deletion
		wiki.addTiddler({title: "test", test: "C!!F"});
		wiki.deleteTiddler(utils.fieldConf("test", "reference").title);
		wiki.renameTiddler("C", "D");
		expect(wiki.getTiddler("test").fields.test).toEqual("C!!F");
	});
});

});
