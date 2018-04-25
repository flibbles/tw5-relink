/*\
This loads all the tiddlywiki tests by having tiddlywiki run their modules.
\*/

var chaiHelpers = require('chai-helpers');

var $tw = chaiHelpers.boot(function(loader) {
	loader.loadPlugin("./plugins/flibbles/relink");
	loader.loadDirectory("./test/tiddlers");
});

// This line here loads all the tests into Mocha
$tw.modules.applyMethods("test.relink");
