/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");

describe('configuration', function() {

it('updates whenever configuration changes', function() {
	var wiki = new $tw.Wiki();
	utils.monkeyPatch($tw.utils, "nextTick", (fn) => fn(), function() {
	utils.collect("log", function() {
		wiki.eventsTriggered = false;
		wiki.addTiddler({title: "test", test: "A"});
		wiki.eventsTriggered = false;
		wiki.renameTiddler("A", "B");
		expect(wiki.getTiddler("test").fields.test).toEqual("A");

		// Detects additions
		wiki.eventsTriggered = false;
		wiki.addTiddler(utils.fieldConf("test", "title"));
		wiki.eventsTriggered = false;
		wiki.renameTiddler("A", "B");
		expect(wiki.getTiddler("test").fields.test).toEqual("B");

		// Detects modifications
		wiki.eventsTriggered = false;
		wiki.addTiddler({title: "test", test: "B!!F"});
		wiki.eventsTriggered = false;
		wiki.addTiddler(utils.fieldConf("test", "reference"));
		wiki.eventsTriggered = false;
		wiki.renameTiddler("B", "C");
		expect(wiki.getTiddler("test").fields.test).toEqual("C!!F");

		//Detects deletion
		wiki.eventsTriggered = false;
		wiki.addTiddler({title: "test", test: "C!!F"});
		wiki.eventsTriggered = false;
		wiki.deleteTiddler(utils.fieldConf("test", "reference").title);
		wiki.eventsTriggered = false;
		wiki.renameTiddler("C", "D");
		expect(wiki.getTiddler("test").fields.test).toEqual("C!!F");
	});
	});
});

});
