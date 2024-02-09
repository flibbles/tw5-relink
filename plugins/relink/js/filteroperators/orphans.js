/*\
module-type: relinkfilteroperator

Filter function for [relink:orphans[]].
Returns all tiddlers which are not referenced in any way

\*/

(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.orphans = function(source,prefix,options) {
	return options.wiki.getRelinkOrphans({ignore: ['$:/StoryList']});
};

})();
