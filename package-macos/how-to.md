
## NOTARIZATION RESEARCH

This draws on our [notes][notes] on the [repo][repo] wiki:
[notes]:https://gitlab.com/inq-seeds/boilerplate/wikis/electron-code-signing
[repo]:https://gitlab.com/inq-seeds/boilerplate/

> Notarization is a separate security process from Code Signing. It registers your app signature, after it has been validated, with Apple's servers. The notarization process contacts Apple and then returns a 'ticket' that can be 'stapled' to your app so it can run with no network.

REQUIREMENTS: You have an "Apple ID", and an Apple Developer account. You have generated a "Developer ID" and have it installed in your Mac's login keychain using the "Keychain Access" app.

PROCESS:

* build app with "hardened runtime"
* sign app with valid "Developer ID"
* notarize app somehow

NOTARIZATION: COMMON

* sign into appleid site and create "application-specfic password" 
* add "new password item" in "Keychain Access" app

*adding new password item*
* By CLI: `security add-generic-password -a "<my-apple-id>" -w <application-specific-password> -s "AC_PASSWORD"`. To verify, `security find-generic-password -a AC_USERNAME` or use flag `-l AC_PASSWORD`
* By KEYCHAIN APP: "add new password item" to "login" keychain. For "Keychain Item Name", enter AC_PASSWORD. For "Account Name" enter your Apple ID. For "Password" enter the application-specific password. In the app you'll see the item "AC_PASSWORD" appear as type "application password"

*using electron-notarize*
required: build the package with:
* set `hardenedRuntime` in "mac" configuration for electron-builder
* set the correct "entitlements" ('allow-unsigned-executable-memory' is "only requirement" for an Electron application" [4])

*wrinkle: we are using electron-packager, not electron-builder*
* apparently electron-builder used to used electron-packager, but it is no longer maintained so electron-builder is the new hotness. electron-builder is an electron package making with support. It used to use electron-packager, but no longer does. It doesn't include the app side of the equation. electron-forge goes a step further to provider the boilerplate for your app, including transpilation. It packages too, relying on electron-packager (I believe?)
* WHAT THIS MEANS FOR US: We're using electron-packager with our own custom webapp build system. We therefore should be looking at electron-packager equivalents for setting up, since electron-builder has its own requirements.

*using electron-notarize with electron-packager*
NOTE: We need to set hardened runtime with entitlements with electron-packager.

PRE-CHECK: `electron-packager` options we are using:
* `--out` ./dist
* `--electron-version` '3.1.13'
* `--apple-bundle-id` 'com.davidseah.inquirium.meme'

PRE-CHECK: `electron-osx-sign` options we are using:
* `--platform` = 'darwin'
* `--type` = 'distribution'
* `--version` = '3.1.13'
* `--strict`
PRE-CHECK: adding **new** options to `electron-osx-sign`:
* `--hardened-runtime`
* `--entitlements` = 'package-macos/meme.entitlements'
* `--entitlements-inherited` = 'package-macos/meme-inherited.entitlements'
* '--identity' (defaulted to something)
* '--keychain' (defaulted to system keychain)
* '--platform' (defaulted to 'darwin')

APP SIGNING NOW WORKS!!!!!! APP RUNS WITHOUT CRASHING!
The key addition was 'entitlements-inherited' so the underlying library elements (e.g. V8) are also signed.

Next let's try to notarize by using `electron-notarize`:
* FAILURE


- - -
## REFERENCES

Distribute Outside of the Mac App Store
[1]:https://help.apple.com/xcode/mac/current/#/dev033e997ca

How to notarize a Unity build for macOs 10.15 Catalina (forum post)
[2A]:https://forum.unity.com/threads/notarizing-osx-builds.588904/#post-4786748
.. summary from forum post
[2B]:https://gist.github.com/dpid/270bdb6c1011fe07211edf431b2d0fe4
.. example use of codesign
[2C]:https://forum.unity.com/threads/notarizing-osx-builds.588904/#post-4786748

Kinds of entitlements:
[3]:https://developer.apple.com/documentation/bundleresources/entitlements

Notarizing your Electron Application
[4]:https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

Differences between Electron Packager, Electron Forge, Electron Builder
[5]:https://stackoverflow.com/questions/37113815/electron-builder-vs-electron-packager#37114325

Signing Electron App with electron-forge (which uses electron-packager)
[6]:https://stackoverflow.com/questions/46480682/how-to-sign-electron-app-using-electron-forge

Guide for Electron OSX Sign
[7]:https://mintkit.net/electron-userland/electron-osx-sign/guide/

Why Crash with Exception Typre EXC_CRASH
[8]:https://developer.apple.com/library/archive/qa/qa1884/_index.html

Debugging with npm debug
e.g. DEBUG=electron-packager npx electron-packager ...
[9]:https://www.npmjs.com/package/debug

Debugging with Crashpad
This is built into Chromium on Mac, and can be seen in Mac system console errors or crash report dialog boxes.
[10]:https://thorsten-hans.com/electron-crashreporter-stay-up-to-date-if-your-app-fucked-up

