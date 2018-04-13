/*\
This loads all the tiddlywiki tests by having tiddlywiki run their modules.
\*/

var prefix = require("tiddlywiki/boot/bootprefix.js").bootprefix();
prefix.boot.argv = ["--version"];
var $tw = require("tiddlywiki").TiddlyWiki(prefix);

function loadDirectory(path) {
	var tiddlerFiles = $tw.loadTiddlersFromPath(path);
	$tw.utils.each(tiddlerFiles, function(tiddlerFile) {
		$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
	});
}

function loadPlugin(path) {
	var plugin = $tw.loadPluginFolder(path);
	$tw.wiki.addTiddler(plugin);
};

var oldLoader = $tw.loadTiddlersNode;
$tw.loadTiddlersNode = function() {
	oldLoader.call($tw);
	loadPlugin("./plugins/flibbles/relink");
	loadDirectory("./test/tiddlers");
};

$tw.boot.boot();
$tw.describe = describe;
$tw.it = it;
$tw.before = before;
$tw.after = after;
$tw.beforeEach = beforeEach;
$tw.afterEach = afterEach;

// This line here loads all the tests into Mocha
$tw.modules.applyMethods("test.relink");
