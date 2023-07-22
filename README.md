# Bachelor Thesis
https://is.muni.cz/th/tsxu8/

# Instructions

Install Node.js v12 - https://nodejs.org/.
Enter the `uploader/` directory and run the `npm install` command. 
This will install all the dependencies into the `node_modules` directory.
You can then compile the server part of the application using the
`npm run build`. You can then start the server with the command 
`npm run start` command. The client part can be compiled and started at the same time
using the `npm run build:dev` command. The server and the client part are compiled in this way
run in development mode. Open a browser and open `http://localhost:8080`.
The application should load correctly.
# Useful commands

| Command | Description |
|------------------|-------------|
| `npm run build` | The server part of the application is compiled
| `npm run start` | Starts the server part of the application
| `npm run build:dev` | The client part of the application is compiled and started

# Project structure
## Client
`uploader/client/src/assets` - here are the images used

`uploader/client/src/components` - here are the *.vue components
user interface

`uploader/client/src/js` - here is a simple wrapper to work better with
crypto-browserify using typescript

`uploader/client/src/style` - here you can find a global file with the defined application style

`uploader/client/src/ts` - here is all the logic for the client side of the *.ts application
    
    authDropbox.ts - contains logic that ensures working with the access token 
    cipher.ts - contains all the logic for encryption, decryption and value generation
    compatibility.ts - a tool that detects missing functions and replaces them if necessary
    config.ts - here you can set various constants for encryption etc.
    downloadFile.ts - implementation of downloading a file together with storing it on the user's disk
    downloadFileSource.ts - a resource that ensures correct downloading of the file in parts
    downloadMetadata.ts - download and validation of metadata
    downloadMetadataSource.ts - a resource that ensures correct download of metadata based on scopes
    limiter.ts - provides size control of the uploaded file
    metadata.ts - class for representing metadata
    receiver.ts - contains classes that define how to download from given repositories
    sender.ts - contains classes that define how the file is uploaded to the given repositories
    uploadFile.ts - uploading a file
    uploadSource.ts - the source of the encrypted file for upload - provides partitioning and encryption
    utils.ts - basic tools for creating links, etc.
    
## Server
`uploader/server/dist/files` - uploaded files are stored here

`uploader/server/src` - this is where the server source code is located

## Tests
`uploader/tests` - here are the tests for the server but also for the client part
# Online
https://aploader.herokuapp.com/
