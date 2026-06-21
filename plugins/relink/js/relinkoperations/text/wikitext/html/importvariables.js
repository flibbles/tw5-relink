/*\

Handles state updating required for $importvariables widgets

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var ImportContext = relinkUtils.getContext('import');
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');

exports.name = "importvariables";

exports.report = function(element, parser, callback, options) {
	if (element.tag === "$importvariables") {
		processImport(element, parser, options);
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	if (element.tag === "$importvariables") {
		processImport(element, parser, options);
	}
};

function processImport(element, parser, options) {
	var importFilterAttr = element.attributes.filter;
	if (importFilterAttr) {
		processImportFilter(parser, importFilterAttr, options);
	}
};

// This processes a <$importvariables> filter attribute and adds any new
// variables to our parser.
function processImportFilter(parser, importAttribute, options) {
	if (typeof importAttribute === "string") {
		// It was changed. Reparse it. It'll be a quoted
		// attribute value. Add a dummy attribute name.
		importAttribute = $tw.utils.parseAttribute("p="+importAttribute, 0)
	}
	var context = parser.context;
	var importFilter = computeAttribute(context, importAttribute, options);
	parser.context = new ImportContext(options.wiki, context, importFilter);
};

function computeAttribute(context, attribute, options) {
	var typeHandler = attrTypeOperators[attribute.type];
	if (typeHandler) {
		return typeHandler.compute(attribute, context, options);
	}
	return undefined;
};
