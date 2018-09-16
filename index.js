const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const ping = require('net-ping');
const session = ping.createSession();

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive'
];
const TOKEN_PATH = 'token.json';
const DRIVE_PATH = 'AFK';               // folder to create/use on Google Drive
var DRIVE_PATH_ID;
const LOCAL_PATH = 'files';
const modulus = 1;						// number of hours per file
var GOOGLE_CREDS;

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, googleCreds) => {
  if (err) return console.log('Error loading client secret file:', err);
  GOOGLE_CREDS = googleCreds;
  authorize(JSON.parse(googleCreds), createFolder);
});

var d = new Date();
var step = hourGroup(d, modulus);

//var file = fs.openSync(path.join(LOCAL_PATH, `${formatDate(d)}+${pad2(step)}.txt`), 'a');
var stream = getStream(LOCAL_PATH, d, step);

var busy = false;
var myTimer = setInterval(doWork, 1000);

function doWork() {
	if (busy) {
		return;
	}

	busy = true;
	var d = new Date();
	var curStep = hourGroup(d, modulus);
	if (curStep != step) {
		step = curStep;
		//fs.closeSync(file);		
		//file = fs.openSync(path.join(LOCAL_PATH, `${formatDate(d)}+${pad2(step)}.txt`), 'a');
		stream.end(() => {
			authorize(JSON.parse(GOOGLE_CREDS), (auth) => {
				var oldStream = stream;
				uploadFile(oldStream.path, DRIVE_PATH_ID, auth);
				stream = getStream(LOCAL_PATH, d, step);
			});			
		});	
	}
	
	session.pingHost("8.8.8.8", (err, target, sent, rcvd) => {
		var result;
		if (err) {
			if (err instanceof ping.RequestTimedOutError) {
				result = 'timeout';
			} else {
				result = 'unknown';
			}
		} else {
			result = `ok\t${rcvd - sent} ms`;
		}
		console.log(`${d.toLocaleString()}\t${target}\t${result}`);
		// fs.writeSync(file, `${d.toLocaleString()}\t${target}\t${result}\n`);
		stream.write(`${d.toLocaleString()}\t${target}\t${result}\n`);
		session.close();
	});

	busy = false;
}

// Create folder if it does not already exist, using an OAuth2 client.
// Nope. That comment is a lie. Just create the folder. Google Drive is perfectly happy with non-unique names.
function createFolder(auth) {
	const drive = google.drive({version: 'v3', auth});
  
	var fileMetadata = {
	'name': DRIVE_PATH,
	mimeType: 'application/vnd.google-apps.folder'
	};

	drive.files.create({
		resource: fileMetadata,
		fields: 'id'
		}, (err, folder) => {
		if (err) {
		  console.error(err);
		} else {
		  DRIVE_PATH_ID = folder.data.id;
		  console.log('Folder Id: ', folder.data.id);
		  //uploadFile(drive, folder.data.id);
		}
	});
}

/**
 * Upload a file
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
 function uploadFile(fileName, folderId, auth) {
 	console.log(`uploading ${fileName}`);
 	const drive = google.drive({version: 'v3', auth});
  	var fileMetadata = {
	    'parents': [folderId],
	    'name': path.basename(fileName)
  	};

	var media = {
		mimeType: 'text/text',
		body: fs.createReadStream(fileName)
	};

	drive.files.create(
		{
			resource: fileMetadata,
			media: media,
			fields: 'id'
		}, 
		function (err, file) {
			if (err) {
			  // Handle error
			  console.error(err);
			} else {
			  //console.log(file);
			  console.log('File Id: ', file.data.id);			 
			}
			callback();
		}
	);
 }

// Google Drive helpers, lifted wholesale from the API docs
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function. (Get a token if we don't already have one.)
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// other helpers
function hourGroup(date, modulus) {
	return Math.floor(date.getHours() / modulus) + 1;	// We like the natural numbers.
}

function formatDate(date) {
		var year = date.getFullYear();
		var month = pad2(date.getMonth() + 1);
		var day = pad2(date.getDate());
		return `${year}-${month	}-${day}`;
}

function pad2(value) {
	if (value.toString().length == 2) return value;
	return '0' + value;
}

function getStream(base, date, step) {
	return fs.createWriteStream(path.join(base, `${formatDate(date)}+${pad2(step)}.txt`), {flags:'a'});
}







