{
	"translatorID": "25f4c5e2-d790-4daa-a667-797619c7e2f2",
	"label": "CSV",
	"creator": "Philipp Zumstein",
	"target": "csv",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"displayOptions": {
		"exportCharset": "UTF-8xBOM",
		"exportNotes": false
	},
	"inRepository": true,
	"translatorType": 2,
	"browserSupport": "g",
	"lastUpdated": "2014-05-30 11:58:51"
}

//The export will be stuck if you try to export to a csv-file
//which is already opend with Excel. Thus, close it before or rename
//the new csv-file.

var recordDelimiter = "\n",
	fieldDelimiter = ",",
	fieldWrapperCharacter = '"',
	replaceNewlinesWith = " ",
	valueSeparator = "; "; // For multi-value fields, like creators, tags, etc.

// Exported columns in order of export
var exportedFields = [
	// "Important" metadata
	"key","itemType","publicationYear","creators/author","title","publicationTitle",
	"ISBN","ISSN","DOI","url","abstractNote","date","dateAdded","dateModified",
	// Other common fields
	"accessDate","pages","numPages","issue","volume","numberOfVolumes",
	"journalAbbreviation","shortTitle","series","seriesNumber","seriesText",
	"seriesTitle","publisher","place","language","rights","type","archive",
	"archiveLocation","libraryCatalog","callNumber","extra","notes","attachments",
	"tags/own","tags/automatic",
	// Creators
	"creators/editor","creators/seriesEditor","creators/translator",
	"creators/contributor","creators/attorneyAgent","creators/bookAuthor",
	"creators/castMember","creators/commenter","creators/composer",
	"creators/cosponsor","creators/counsel","creators/interviewer",
	"creators/producer","creators/recipient","creators/reviewedAuthor",
	"creators/scriptwriter","creators/wordsBy","creators/guest",
	// Other fields
	"number","edition","section","runningTime","scale","medium","artworkSize",
	"filingDate","applicationNumber","assignee","issuingAuthority","country",
	"meetingName","conferenceName","court","history","references","reporter",
	"legalStatus","priorityNumbers","programmingLanguage","version","system"
];

var exportNotes;
function doExport() {
	exportNotes = Zotero.getOption("exportNotes");
	writeColumnHeaders();
	var item, line;
	while (item = Zotero.nextItem()) {
		line = '';
		for (var i=0; i<exportedFields.length; i++) {
			line += (i ? fieldDelimiter : recordDelimiter)
				+ getValue(item, exportedFields[i]);
		}
		Zotero.write(line);
	}
}

var escapeRE = new RegExp(fieldWrapperCharacter, 'g');
function escapeValue(str) {
	if (typeof replaceNewlinesWith == 'string') {
		str = str.replace(/[\r\n]+/g, replaceNewlinesWith);
	}
	
	return str.replace(escapeRE, fieldWrapperCharacter + '$&');
}

function writeColumnHeaders() {
	var line = '';
	for (var i=0; i<exportedFields.length; i++) {
		line += (i ? fieldDelimiter : '') + fieldWrapperCharacter;
		var label = exportedFields[i].split('/');
		switch (label[0]) {
			case 'creators':
				label = label[1];
			break;
			case 'tags':
				label = ( label[1] == 'own' ? 'Manual Tags' : 'Automatic Tags');
			break;
			default:
				label = label[0];
		}
		line += escapeValue(label) + fieldWrapperCharacter;
	}
	Zotero.write(line);
}

function getValue(item, field) {
	var split = field.split('/'), value = fieldWrapperCharacter;
	switch (split[0]) {
		case 'publicationYear':
			if (item.date) {
				var date = ZU.strToDate(item.date);
				if (date.year) value += escapeValue(date.year);
			}
		break;
		case 'creators':
			var creators = [];
			for (var i=0; i<item.creators.length; i++) {
				var creator = item.creators[i];
				if (creator.creatorType != split[1]) continue;
				creators.push(creator.lastName
					+ (creator.firstName ? ', ' + creator.firstName : ''));
			}
			value += escapeValue(creators.join(valueSeparator));
		break;
		case 'tags':
			var tags = [], tagType = split[1] == 'automatic';
			for (var i=0; i<item.tags.length; i++) {
				if (item.tags[i].type == tagType) tags.push(item.tags[i].tag);
			}
			value += escapeValue(tags.join(valueSeparator));
		break;
		case 'attachments':
			var paths = [];
			for (var i=0; i<item.attachments.length; i++) {
				paths.push(item.attachments[i].localPath || item.attachments[i].url);
			}
			value += escapeValue(paths.join(valueSeparator));
		break;
		case 'notes':
			if (!exportNotes) break;
			var notes = [];
			for (var i=0; i<item.notes.length; i++) {
				notes.push(item.notes[i].note);
			}
			value += escapeValue(notes.join(valueSeparator));
		break;
		default:
			if (item[field]) {
				value += escapeValue('' + item[field]);
			}
	}
	return value + fieldWrapperCharacter;
}