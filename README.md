# Model and Evidence Mapping Environment (MEME)

The MEME software tool is designed to help students articulate and model their understanding of scientific concepts using concept maps and evidence maps.  Concept maps have previously been used to allow students to express how the elements within a system are interrelated (Hmelo-Silver et al, 2017). Evidence maps have been successfully used to explicitly indicate how different aspects of a scientific model are grounded in disparate forms of evidence (Toth, Suthers, &amp; Lesgold, 2002). Within MEME, students will both model their understanding and indicate the sources of evidence (e.g., simulation and empirical) for specific aspects of the model. Students will also have the opportunity to rank their different sources of evidence based on their confidence level in how each source supports an aspect of their model, helping them to reflect on the relationship between evidence and models.

The software is designed to work in a classroom setting.  The core software runs as a node.js application on a server (a reasonably powered laptop will suffice).  Students log into the server via web browsers on their laptops and chromebooks.  The node.js application can be compiled and deployed as a standalone Electron application.

**Note**: this software is a work in progress, and is provided as-is. While we have tested it succesfully in our own context, we make no warranty about how it will run in your context nor about its security (we recomend using de-identified data only if you are not using it in a secure environment). Please evaluate it on your own before implementing.

See the [1.3.1](https://gitlab.com/inq-seeds/boilerplate/-/tags/v1.3.1-final) and [1.3.0 Release Notes](https://gitlab.com/inq-seeds/boilerplate/-/tags/v1.3.0-final) for information on the latest features.  You can also view all [Release Notes](https://gitlab.com/inq-seeds/boilerplate/-/tags) by browsing Tags.

See the [Wiki Home](https://gitlab.com/inq-seeds/boilerplate/-/wikis/home) for End User Instructions.

Please visit [modelingandevidence.org](http://modelingandevidence.org) for more information about the MEME project.

MEME is sponsored by the National Science Foundation.

---




---
---


# To Install and Run

Running the system involves building and packaging the application, and starting up a local server, admin interface, and student devices.  These instructions assume you're familiar with working with Git and Node and using `npm` in the terminal.

## I. Local Server

### I.A. Check Out Local Server Code

This assumes you've already installed NodeJS.  If you haven't, we recommend using [nvm](https://github.com/nvm-sh/nvm).  This will allow you to select different Node versions.  As of November 2019, we are currently using Node Version 10.9.0.

1. Check out the `dev` branch.
1. If you're using `nvm`, type `nvm use` to auto-load the recommended Node version (10.9.0).  You may also need to type `nvm install` to install 10.9 if it's not already installed on your machine.
2. `npm ci` -- You might need to install some packages before doing a clean.
3. `npm run clean:all` -- Remove all existing database and node modules.
4. `npm ci` -- Install node modules

### I.B. Download Resources

The pdf and netlogo simulation resources are not currently in the repo.  You will need to download them from the source (ask Joshua for them) and place them in the `boilerplate/src/app-web/static/dlc` folder.


### I.C. Build and Run the Local Server

You should build and run the local server first just to make sure everything is working.

1. `npm run dev`
2. Point your browser at `http://localhost:3000/` -- You should see the MEME login screen.


### I.D. Start Production Server

If you want to run the server in a production environment, such as a Digital Ocean server, use a different start script.

1. `npm start`
2. Point your browser at `http://<server_ip>:3000/` -- You should see the MEME login screen.

This will start the local server and load the existing `meme` database.

You can also create and use arbitrary databases.  E.g. to create a new database, you would:

1. Duplicate `datasets/_blank`, e.g. name it `fall2020`
1. Start it up using the `DATASET` environment parameter, e.g. `DATASET="fall2020" npm start`
1. You can quit/reboot/update the server, and start it up again with `DATASET="fall2020" npm start` and the data will be retained.


## II. Building and Running the Electron App

Once you verify the local server is running, you can build and deploy a standalone Electron application for distribution to teachers, so all they have do to start a MEME server in their classroom is to double click on the MEME.app.

If you want to seed (no pun intended) a MEME Electron application with sample data, e.g. configure teachers, classrooms, and groups, example models, etc, you can just run the MEME application, make the changes, and then duplicate and run the MEME.app.  

The one thing that can't be easily changed via the admin interface are the resources, so generally it's best to download them first.  (Technical note: By running the Electron app, you're automatically loading the `db.js` files in `system/datasets/meme`.  If you want to edit the `db.js` files by hand for the Electron app, edit those.

To build and run the Electron app:
1. Make sure all the resources you want to use are in the `boilerplate/src/app-web/static/dlc` folder.
2. `npm run package`
3. Find the app in `boilerplate/dist/meme-darwin-x64/meme.app`
4. Double click the `meme.app` file to start it.
5. Point your browser at `http://localhost:3000/` -- You should see the MEME login screen.

You can copy and distribute the `meme.app` file by itself.  But first, you might want to set up some template admin settings.  See the "Admin Interface" section below.

NOTE: Because the `meme.app` Electron app is not signed and notarized, you may have to disable some security features on your Mac to run it.  As of April 2023, it is now possible to Code Sign and Notarize the Electron app for distribution.  You will need to be registered as an Apple Developer in order to do so.  Please refer to the [README-signing.md](README-signing.md) file for details.


For more technical information about creating and managing the dataset, see:
* [Dataset Editing for Curriculum Development](https://gitlab.com/inq-seeds/boilerplate/-/wikis/User/Dataset-Editing-for-Curriculum-Development).
* [Dataset Mangement](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Dataset-Management)



**Updating Resources in the MEME.app**

If you've already built and distributed the MEME app and find that you need to add or change resources, you can still update resources in the MEME.app manually:
1. Quit the MEME app.
2. Find the "meme.app" file in your Finder.
3. Ctrl-Click on the "meme.app" and select "Show Package Contents"
4. Navigate to `meme.app/Contents/Resources/app/web/static/dlc`
5. Copy your new resources into the `dlc` folder.
6. Run the MEME app and use the admin interface to add the resources and assign them to classrooms.
7. You can now duplicate the MEME app file and distribute it.  The new resources should be included with the app.



## III. Admin Interface

Use the Admin Interface to set up teachers, classrooms, groups, students, ratings definitions, criteria, sentence starters, and resources.

Each classroom can have its own ratings definition, criteria, and sentence starter, as well as a subset of the resources enabled for them.  Resources are shared across all classrooms, but are only visible to the class if you enable it.  This means you'll want to carefully set up each class's initial settings if you want them to be anything other than the defaults.  No resources are enabled by default, so you will have to enable them for each class.

To access the Admin Interface:
1. Start the Meme app.
2. Point your browser at `http://localhost:3000/#/admin` -- You'll see the admin interface.

If you are running the server on a remote server, you can use the special `?danishpowers` parameter to access the admin page.




## IV. Client Machines

As of 1.0, the meme app should run on Chrome browsers on Mac laptops, Windows laptops, and Chromebooks.  It should mostly work on Android tablets (though they have not been fully tested). Unfortunately there are known rendering issues with iOS Chrome.

### IV.A. Install Screen Capture Extension

In order to capture screens when creating a new evidence, you will need to install the MEME Extension on each student machine.

1. Check out https://gitlab.com/inq-seeds/screenshot
2. Go to *SETTINGS* in Chrome (in "stacked dot" menu upper right)
3. Go to *EXTENSIONS* (in left sidebar of settings screen)
4. Enable ***Developer Mode***
5. Choose *Load an Unpacked Extension*
6. Find the *extension* directory in `screenshot` repo
7. Once the extension is installed, when students create a new evidence, a screenshot of the resource will be automatically captured.

NOTES:

* As of November 2019, the extension has been confirmed to work with Chrome on macOS, Windows 10, and ChromeOS.
* The screenshot only works when the Resource View is opened.  If you're just viewing the Resource Library list, you can't capture the screen.
* The app will work without the extension, but students will have to use other tools to capture the screen and manually insert them to evidence.


### IV.B. Run as Student

To bring students into the app:
1. Start the MEME app.
2. In the admin interface, make sure you've created groups and added students to each group.
3. Copy the student login tokens and hand them out to students.
4. Copy the IP address from the MEME app, e.g. `http://192.168.1.10:3000`
5. On the students Chrome browser, enter that URL: `http://192.168.1.10:3000`
6. Enter the student login token.

NOTES:

* Each model is owned by a group.  A group can have any number of students.  Any student in the group will have full author access to the model when they log in.
* Sticky note comments are tied to individual students, but any student can edit any comment made by a member of their group.


### IV.C. Teachers Viewing and Commenting on Student Work

Teachers can log in and view student work much as a student would:
1. Start the MEME app
2. In the admin interface, select the teacher, and write down their login token, e.g. `MSBROWN-VYFZ`.
3. Point your browser to the student login URL, e.g. `http://192.168.1.10:3000` (you can also use localhost if you're on the server).
4. Login with the token.
5. You should have read-only comment access to all student models in all of your classrooms.


## V. Researcher Analysis

The new **database export and import** feature allows researchers to periodically export database files during a study as an archive of student data and to review and analyze the data at a different time and place.

This feature is primarily intended to support researcher analysis of study data.  It is not designed to support loading arbitrary databases to seed a project.


### V.A. Exporting a Database File

To export a database file:
1. Start the Electron app
2. Click on the green "Export MZIP" to export a database file.

You can also drag the green "Export MZIP" button to your desktop to create a database file.

You can keep the default name, or rename it something else, but it must end in `MEME.ZIP` for the file to be read by MEME.


### V.B. Importing a Read-only Database File

To import a database file:
1. Start the Electron app
2. Drag a valid `MEME.ZIP` database file to the purple "MZIP IMPORT" button.
3. The project will open in Read-Only mode.
4. You can browse to `http://localhost:3000/` to login and view models.
5. No data will be saved.
6. Quit and restart the Electron app to restore normal function.


---


## Important Notes


### Research Logs

* Researcher logs can be found in `meme.app/Contents/Resources/runtime/logs`.  Look for dated log files like `meme.app/Contents/Resources/runtime/logs/2019-09102019-0910-log-102440.txt`
* Screenshots can be found in `meme.app/Contents/Resources/runtime/screenshots`.

NOTE: Over time research logs and screenshots can grow quite large.  You'll want to keep an eye on disk space, especially if you use the same app over months.


### Login Tokens

* Student login tokens are based on group Ids. So if you delete a student from one group and add them to another, they will have a new token.
* Teacher login tokens are based on their name, so if you update their name, they will have a new token.


### Backups

We recommend daily backups.  Better yet, back up after each classroom period.

* The easiest way to backup is to just duplicate the whole MEME app.
* If you want to save space, you can just grab the database file in `meme.app/Contents/Resources/system/datasets/meme.loki` (assuming you didn't rename the database or are running a different database file).

*Database Snapshots*
When the server starts up, MEME will now:

* automatically copy the current LOKI database file (usually `meme.loki` in the classroom) to a backup file using the same date format as the log files. The database file is of the form `YYYY-MMDD-meme-HHMMSS.loki.snapshot` and is in the `runtime` directory.
* log the file name of the database snapshot in the log

The snapshot time corresponds to the snapshot log, e.g. `2020-0209-log-124525.loki.snapshot` = state of db at the *start* of the `2020-0209-log-124525.txt` log.


---


## Getting Ready

* Managing Datasets
  * [Dataset Editing for Curriculum Development](https://gitlab.com/inq-seeds/boilerplate/-/wikis/User/Dataset-Editing-for-Curriculum-Development)
  * [Dataset Management](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Dataset-Management)
* Deploying
  * [Deploy Electron](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Deploy-Electron)
  * Digital Ocean Deployment [deploying on digital ocean](https://gitlab.com/inq-seeds/boilerplate/-/wikis/Developer/Digital-Ocean-Deployment) *(Placeholder only)*
