# Code Signing and Notarization README

TABLE OF CONTENTS
* [Overview](#overview)
* [Pre-requisites](#pre-requisites) -- One time setup
* [Signing and Notarizing](#signing) -- Sign and Notarize the Electron app
* [Technical Notes](#technical-notes)
* [Troubleshooting](#troubleshooting)

# Overview

There are four ways to build and deploy MEME:
1. Run MEME on a local dev server, such as a laptop in a classroom.
2. Run MEME on a production server, such as a Digital Ocean droplet (not officially supported nor recommended).
3. Run MEME as an Electron application on the development Mac.
4. Run MEME as a code signed and notarized Electron application on ANY Mac.

This a detailed guide for code signing and notarizing the built Electron applications (#4) for distribution to other computers.  Without code signing, the Electron application will not run on other computers without bypassing security alerts.  

See [Deploy Electron](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Deploy-Electron) for general instructions on building the Electron application.  Once you have successfully built the application, use these instructions to Code Sign and Notarize the application.

---

## Background

Applications pick up a 'quarantine' flag when obtained through most normal means, e.g. downloading from the Internet, obtaining from Slack, etc.  This quarantine flag will cause MacOS versions starting with Catalina (10.15) to scan the application with its Gatekeeper security subsystem before the application can be launched.

Gatekeeper will check the application to ensure it is:

1. Signed with a valid developer or distribution identity
2. Signed additionally by Apple ("notarized") indicating that the application was submitted to Apple after packaging and signing for review and confirmation that it meets standard security requirements

The above steps are integrated into the MEME build process but the following section describes prerequisites that need to be met.

*Note*: The code signature and notarization include an index of the package files and presumably hashes. 
It is critical that any post-build file system artifacts are stored separately from the package itself.
As of this writing, runtime artifacts such as uploads, logging, and the MEME database are stored in the user's `~/Documents/MEME` folder.

---
# Pre-requisites

To successfully sign a packaged MEME application bundle, you must first set up the following.  You should only need to do this once for each machine you want to use for code signing and notarizing.

### 0. Use `nvm` and node version 10.9.0
Ensure that `nvm` is installed and that you have executed `nvm use 10.9.0` (the version this process was tested with) or `nvm use` to use the project's current node version.

### 1. Get an Apple Developer ID
This can be obtained by signing up for it on the Apple website. You will need a personal Apple ID, and set up a Deveoper Account.  Further instructions can be found on [Apple Support](https://support.apple.com/en-us/HT204316)

The process will vary depending on whether you are enrolling as an individual developer or an organization.
In either case, there is an annual fee associated with maintaining a developer account.

Note that you will affiliate an Apple Developer Account with your personal Apple ID.

After you set up your Apple Developer ID, you will want to set it up on your development machine:

1. Get the latest XCode
2. Sign into https://developer.apple.com/account using your personal Apple ID (not the Apple Developer Account id)

You'll need 2 certificates associated with the Apple Developer Account
* Developer ID Application certificate
* Mac Developer ID Application private key -- see https://stackoverflow.com/questions/12867878/missing-private-key-in-the-distribution-certificate-on-keychain -- select both items and select "Export 2 items..."


### 2. Create a Certificate Signing Request
Apple's Instructions for [Creating a Certificate Signing Request](https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request)

The certificate type should be "Developer ID Application".
In order to obtain the certificate, you will be required to use a macOS-based system to generate a Certificate Signing Request (CSR).

This CSR will be uploaded to Apple when you are creating the certificate.

1. Launch Keychain Access located in /Applications/Utilities.
2. Choose Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority.
3. In the Certificate Assistant dialog, enter an email address in the User Email Address field.
4. In the Common Name field, enter a name for the key (for example, Gita Kumar Dev Key).
5. Leave the CA Email Address field empty.
6. Choose “Save to disk,” then click Continue.
7. Save the file for use later in step 5 when you add the "Apple Development" and "Mac Development" certificates.


### 3. Create a "Developer ID Application" certificate
Create a "Developer ID Application" certificate by:

1. In your browser, sign in to your Apple Developer account
2. Navigate to the "Certificates" area of the site
3. Select the option to create a new certificate.

It's possible your organization has previously created Developer ID Application certificates.  Just download one and go on to step 4.

To check on the validity of certificates, open "Keychain Access" and look at the "Default keychains > login"
It should look something like this:

  "Developer ID Application: Inquirium LLC (XXXXXX)"
  
Remove Expired Certificates -- If there are expired certificates, it's helpful to remove them.


### 4. Install the "Developer ID Application" certificate on your development machine
When the certificate creation process is complete, you will be able to download a `.cer` file from the Apple Developer website.
This file once downloaded can be "run" (double-click it to install it) on your MacOS system to install it, preferentially into the `login` keychain (as this will not require administrative rights).


### 5. Install the latest intermediate Apple Certificate Authority certificate on your development machine.
You need to install the intermediate Apple Certificate Authority certificate appropriate for the Developer ID certificate (as of this writing, it is the "Developer ID Certificate Authority G2" certificate).
These certificates are available for download [here](https://www.apple.com/certificateauthority/).
This can be installed into the same `login` keychain as your Developer ID certificate.

You can also find it https://developer.apple.com/account/resources/certificates/add under "Intermediate Certificates > Developer ID - G2 (Expiring 09/17/2031)" 

You probably want to install all of them, e.g.:
* Worldwide Developer Relations Certificate Authority (Expiring 02/07/2023)
* Worldwide Developer Relations Certificate Authority (Expiring 02/20/2030)
* Worldwide Developer Relations - G4 (Expiring 12/10/2030)
* Developer ID - G2 (Expiring 09/17/2031)

You may also need the following certificates:
* Apple Development
* Mac Development

To do this:
1. Create a New Certificate
2. Upload your CSR, created in Step 3 above.
3. Download your new certificate
4. Double-click it to install it.

Save the .cer files someplace secure as backups.

To verify that things are working, in a terminal, `security find-identity` should list matching valid (non-expired) identiies.


### 6. Prepare the database and resources

As with any Electron build, you want to prepare the database and resources you want to seed the application with.

* See [Dataset Editing for Curriculum Development](https://gitlab.com/inq-seeds/boilerplate/-/wikis/User/Dataset-Editing-for-Curriculum-Development) for more information about preparing the data.
* See [Dataset Management](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Dataset-Management) for more information about how datasets are loaded.




---

# Signing

To successfully notarize a packaged MEME application bundle, it must first be signed.
Once the bundle is signed, it can be submitted to Apple for notarization.


### A. Set up Notarization Variables

Notarizing requires passing some parameters.  The parameters are:

1. An app-specific password: These can generated using your Apple ID using these [instructions](https://support.apple.com/en-us/HT204397).
In general, after signing in you should be able to find a section that allows you to generate "App-Specific Passwords."
Any name can be chosen for the password.

2. Your Apple Team ID: This can be found in your Developer Account.
While on the [Account Page](https://developer.apple.com/account), scroll down to "Membership Details".

3. The above credentials need to be provided as shell environment variables when using the `npm run appsign` build procedure, e.g.:

- `APPLE_ID`: Your Apple ID, see signing pre-requisites
- `APPLE_PASSWORD`: An app-specific password (see pre-requisite #1 above)
- `APPLE_TEAM_ID`: Your Apple Team ID (see pre-requisite #2 above)

For convenience, these can be provided in a `.env` file placed at the project root. 
Create a `boilserplate/.env` file with the following:

```.env
APPLE_ID=<Your ID>
APPLE_PASSWORD=<Your Apple app-specific password>
APPLE_TEAM_ID=<Your Apple Team ID>
```

### B. Code Sign and Notarize the Application

To Code Sign and Notarize the Electron application:
1.  `nvm use` -- If you see errors like `node:56749) Warning: Accessing non-existent property 'cat' of module exports...` you're probably using the wrong version of node.
2.  `npm build package`
3.	`npm run appsign`

This should build and sign an Electron app in `boilerplate/dist/meme-darwin-x64`.  You can distribute the `meme.app` to your teachers

Test it on other computers to make sure
* It runs on other computers without a security warning
* Databases are accessible
* `dlc` resources are accessible



### File Locations

`npm run electron` will load the *.js databases in `src/system/datasets/meme/`.

`npm run dev` will load the *.js databases in `src/system/datasets/test/`.

When you run the Electron app itself, it'll initialize the database using the data in `src/system/datasets/meme/`.
The live / changed data is saved in the respective *.loki files in `/runtime`, e.g. `/runtime/meme.loki` and `/runtime/test.loki`.  As are the logs.  These are the files you'll want to grab.

In the code signed and notarized Electron app, the files are in `~/Documents/MEME/db/*.loki`
(Prior to 2023-04, they were stored in `/Contents/Resources/runtime`.)


---
---

# Technical Notes

See also [Electron Code Signing](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Electron-Code-Signing) for more background on the `npm` scripts used in signing.

## Notes on Signing

The application needs to be signed with a hardened runtime.

An entitlements file is provided for this application, see `src/config/darwin.entitlements.plist`.
It was originally based on a default list of entitlements (as captured from the '@electron/osx-sign' package - see [the source](https://github.com/electron/osx-sign/tree/main/entitlements)).

The following entitlements were added:

- `com.apple.security.cs.allow-jit`: *Likely* required to support the use of a hardened runtime ([source](https://github.com/electron/notarize#prerequisites))
- `com.apple.security.cs.allow-unsigned-executable-memory`: Required for Electron versions under 12 ([source](https://github.com/electron/notarize#prerequisites))
- `com.apple.security.cs.allow-dyld-environment-variables`: *Likely* required to allow for loading of additional dynamic libraries related to Electron
- `com.apple.security.network.server`: Allows for the application to listen on network ports.
- `com.apple.security.cs.disable-library-validation`: Relaxes code signing/validation restrictions on libraries that are loaded which may not be signed or signed by the packaging process. *Likely* required because there may be Electron-related platform libraries incorporated in the package.
- `com.apple.security.cs.disable-executable-page-protection`: *Likely* required; this is an extreme entitelement that allows applications to change their executable code at runtime.

This entitlement list is somewhat broad and additional testing may reveal that some entitlements are unnecessary.
Entitlement failures can have unusual presentation and result in application crashes with obscure exception codes.
It is recommended that any changes to the entitlement list be followed by a thorough test of the application's functionality.


---
---

# Troubleshooting


## Error: `Warning: Accessing non-existent property 'cat' of module exports inside circular dependency`

If you see odd npm errors running `npm run package`, e.g. `(node:84971) Warning: Accessing non-existent property 'cat' of module exports inside circular dependency`, make sure you're using the right version of node.  Run `nvm use` to use node version 10.9.0.  This should fix the warnings.


## Error: `MEME EXEC    - unable to sign application, error: Error: No identity found for signing.`

If you see this error while running `npm run appsign`, the problem is likely a missing or invalid `Developer ID Application` certificate.

 How to Check Validity of Certificates
 
    1. Start Keychain Access
    2. Right-click the certificate (e.g. "Developer ID Certification Authority")
    3. Select "Evaluate..."
    4. Select "Code Signing" on the "Viewing and Evaluating Certificates" window.
    5. Click "Continue"
    6. Look at "Evaluation Status"


Evaluate example:
* "Apple Development: Ben Loh (66K9FF4X8) => Success/Good
* "Mac Developer: Ben Loh (66K97FF4x8) => Success/Good
* "Developer ID Application: David Seah (ZYT769Q5DL)" => Success/Good
* "Developer ID Application: Inquirium LLC (YJ856732W9)" => Success/Good

The key certfiicate that is used is `Developer ID Application: Inquirium LLC (YJ856732W9)`.  Even though it lists as "Success/Good", there may be problems with it.  Use XCode to review the status of the certificate, e.g.: `XCode > Settings > Accounts > bentbloh@gmail > Team: Inquirium LLC > Manage Certificates > Developer ID Application Certificates is listed as "Missing Private..."`



*How do I know which certificate is being used?*

Modify `boilerplate/node_modules/@electron/osx-sign/dist/cjs/sign.js`.  In `signApp()` around line 313 for `// No identify found`, throw a dump into the error, e.g.

    throw new Error(`No identity found for signing -- no identityInUse. validatedOpts ${JSON.stringify(validatedOpts)}`);
