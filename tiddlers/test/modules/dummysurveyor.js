/*\
module-type: relinksurveyor

This will allow through tiddlers that have an uppercased version of
fromTitle inside them.

\*/

exports.survey = function(text, fromTitle, options) {
	return text.indexOf(fromTitle.toUpperCase()) >= 0;
};
