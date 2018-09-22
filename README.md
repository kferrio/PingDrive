# PingDrive
Repeatedly ping Google and periodically upload the results to Google Drive

## Why
Providing internet connectivity is apparently a hard job for my ISP. Really hard. To help them, I hacked together this little script to collect objective data to support what they might otherwise dismiss as the anecdotal ravings of a madman. The script continuously `ping` Google as a proxy for "The Internet" and periodically upload the results to my Google Drive. That is, if I have a connection. Uploading the files to Google Drive makes results available wherever I am -- albeit with some delay -- without the need to open up my firewall at all.

## How
1. Clone this repo.
0. Create a project and generate Drive API credentials in the [Google API Dashboard](https://console.developers.google.com). Alternatively, see this [Quickstart](https://developers.google.com/drive/api/v3/quickstart/nodejs) for Google Drive. Drop the generated `credentials.json` file into your working directory but do _**not**_ commit it. If that's not obvious, you should probably pause.
0. `npm install googleapis@27`
0. `npm install net-ping`
0. `node index.js`
0. _On first run, you will be prompted to create an OAuth2 token for Google Drive, which will be stored in the working directory._

## A Few Important Notes
1. First and foremost, this comes with __ABSOLUTELY NO WARRANTY OF ANY KIND__. This code could expose your Google account to the world, along with everything in it or linked to it. This code could cause you to incur data charges. This code could fill up your Google Drive or cause your computer to burst into flames. This code could even steal your dog. It's that bad. Be smart.
0. Don't expose the `credentials.json` or `token.json` file, say, by uploading it to github. Looking silly will be the lease of your worries.
0. The code uses several snippets from the [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk) examples, which I received under the Apache License 2. This whole repo is under the same license.
0. This code uses the excellent [`net-ping`](https://github.com/nospaceships/node-net-ping#readme), currently at version 1.2.3.
0. The code not from Google or other people is mine. It's awful. Probably full of sloppy async race conditions. You've been warned.
0. This code was built to run with `node 8.12.0` and may well work with other, reasonably contemporary versions of `node`.
0. This code is stable running on Debian 9 and Ubuntu 18.
0. This code is _**not**_ stable on Windows 10 if `net-ping` is gyp'ed with Visual Studio 2017 and imported into the official x64 binary for `node-8.12.0` from https://nodejs.org. I was able to get around this by building `node-8.12.0` from source, using the same Visual Studio 2017 build tools used by `gyp` to build `net-ping`.
0. This is a long list, isn't it?
0. One more time: This is an ugly hack. Pull requests graciously welcomed. Good luck and _caveat lector!_

## Known Issues
This code seems to trigger some errors in the uv library, around setting and stopping polls. The error is a little different on each platform (Raspbian, Windows 10, Debian under WSL, _etc._). This makes PingDrive pretty useless for its intended purpose. It's not clear whether this is caused by an error in this script or something deeper. Any help figuring that out would be appreciated.
