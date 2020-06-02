# MEME UPDATES 2020

## May 25 - Adding database export/import

Here's the outline of tasks, as marked in the source files from our previous work session:

1. console.js: drag-and-drop handler, send to console-main.js
2. console-main.js: message receiver to call URSYS to reinitialize server
3. server.js: variant of initialize to load read-only database
4. server:js: variant of URDB to export readonly database
5. console.js: export button to tell console-main.js to export file
6. server-database: in loaddataset, do migration of database versions

### 1. detecting drag-and-drop

The secret is to use [HTML5 drag and drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop), which will give you the file path. Then you can squirt it along to ipcMain. The general idea:

* in console.js, add a drop zone div and add `onDrop` handler that processes the event and extracts the file paths.
* Use `ipcRenderer` to send a message to `ipcMain` with the data payload.

### 4. exporting database

Jumping ahead, we need to be able to export the database so we can read it back in. I think we just might use the .loki database format, maybe compressing it also. There's a zip tool called [adm-zip](https://www.npmjs.com/package/adm-zip) that looks promising. We can give it an extension .memezip and include the version in the loki database. 

To review, here's our database initialization:

* InitializeDatabase() will create the filepath if it doesn't exist
* InitializeDatabase() will make a timestamped backup if filepath did exist
* InitializeDatabase() will then initiate LokiJS with the filepath
* f_LoadDataset() uses DATAMAP.Collections() to check each collection and initialize it if necessary through f_LoadCollection(). It also clears any session locks.
* f_LoadCollection() checks environment DATASET to override the default dataset. 
* f_LoadCollection() will reset the collection to the dataset in dev mode,
* f_LoadCollection() will not reset if not in dev mode.

To export the database, we want to:
* determine the current database file
* use fs_mkdtempSync to make a temporary folder
* write each collection out as json in temp folder
* copy the loki database to temp folder
* zip everything in the folder

To read the database:
* get the zip archive and unzip to temporary folder
* set READONLY MODE
* set the loki file in the temp folder and initialize from that

To set READONLY mode:
* There is already an **ADMData.IsViewOnly()** check we can use
* Just need to have this check URSESSION

## May 28 - Finishing Database Export / Import

The previous couple of days, did the App Versioning for Rutgers because it seemed relatively simple compared to the database work, which is a multi-step operation. 

We're trying to get our head around the database stuff. 

- [x] highlight drop zone
- [x] show drag icon (and make one)
- [x] try making dialogs
- [x] copy file to desktop
- [x] read file from desktop
- [x] click to import
- [x] click to export

## May 29 - Finishing Database Export / Import 

That UI/system stuff out of the way, can now just try to make the archive.

* [x] create temp directory
* [x] copy loki file into it
* [x] add starter manifest file
* [x] create the zip file
* [x] copy it to desktop
* [x] fix issues with async communication and setting drag flags

## May 30 - Importing the Database

We want to import the directory

* [x] write drag-over, import handlers
* [x] copy to temp directory
* [x] unzip
* [ ] set flags to load from temp directory in read only mode

We have to re-iniitalize the database in readonly mode, but we **don't** have to restart the socket or web servers. 

**Critical Path:**

* **options.memehost** and **env.DATASET** control how the database starts up
* server-database `InitializeDatabase( options )`

`InitializeDatabase()` loads the **`dataset`** specificed by the following priorities:

* process.env.DATASET has the name of the `.loki` file to load
* `DB_DATASETS[memehost]`, where `memehost` can either be 'init', 'electron', or 'devserver' which loads the appropriate hardcoded `.loki` file.

`InitializeDatabase()` uses the **dataset** value (e.g. 'meme') to:

*  sets `db_file` to the returned value of `m_GetValidDBFilePath( dataset )` 
* sets `db_bkup` to be the backup file stored as a snapshot with a dated filename
* It then creates a new LokiDB instance **`m_db`** which is used in all the database routines.

**Implementation Strategy**

1. Check for  `InitializeDatabase({import:{ path, mode:'readonly'},})` options
2. **Kick everyone off the server**
3. create a new `m_db` instance loading the database from the provided `path`
4. `UR.DBQuery` and `ULink._DBQuery( cmd, data )` is the only way to change data
5. `UR.DBTryLock()` and `UR.DBTryRelease()` are used across the UI components to attempt a change.
6. `ADM.IsViewOnly()` is used to set various flags to hide update buttons
7. `IsViewOnly()` is determined by the login tokens currently according to values in `adm-settings`
8. We can insert a new override into `ADM.IsViewOnly()` based on a connection flag. 
9. in `ur-network` `m_HandleRegistrationMessage( msgEvent )`, we receive a number of parameters that are passed to `NetMessage.GlobalSetup()`. We can add a READONLY flag as well that is similar to the ULOCAL parameter
10. In the boot up, `EXEC.JoinNet()` occurs before `EXEC.EnterApp()`, so the URSYS `Hook('CONFIGURE')` handler that has a number of **startup overrides** can check for readonly mode. Here `Session.SetReadOnlyMode()` can be set, and then this value can be used to override.

Reviewing the above strategy, we probably don't need to lock-out anything in the DBQuery because the **primary interlock mechanism is hiding buttons**. So the simplified strategy is:

1. Server: on import do the following
   1. disconnect all clients
   2. `URDB.InitializeDatabase()` again with special path and readonly mode
      1. set `SESSION.SetReadOnly()`
      2. add the new READONLY flag to `server-network` `m_SocketClientAck()` so READONLY mode is transmitted. Can read local `SESSION.IsReadOnly()`
2. Client: On `m_HandleRegistrationMessage()`  in `ur-network`
   1. grab the `READONLY` flag from `regData`
   2. pass to `NetMessage.GlobalSetup()`
3. Client: On `Hook('CONFIGURE')` in `ursys`
   1. add check to `NetMessage.IsReadOnly()` to `SESSION.SetReadOnly()`
4. Client: In `ADM.IsViewOnly()` 
   1. add an override to check `SESSION.IsReadOnly()`

**Implementation**

* [x] call `URSERVER.Initialize()` with `tempdb` option added

* [x] populate `tempdb` with `runtimepath`, `dbfile`, and `appmode` properites

* [x] detect `tempdb` option and create new `server-database:ReInitializeDatabase(options)` function

* [x] disconnect all clients

* [x] reinitialize `m_db` instance

* [x] call `SESSION.SetReadOnly()` from `server-database:ReInitializeDatabase()`

* [x] add `READONLY: SESSION.IsReadOnly()` flag to `server-network:m_SocketClientAck()` 

* [x] `netmessage:GlobalSetup()` add`NetMessage.IsReadOnly()` 

* [x] `ur-network:m_HandleRegistrationMessage()` get READONLY flag

* [x] `ursys:Hook('CONFIGURE')` forward `NetMessage.IsReadOnly` to `Session.IsReadOnly`

* [x] `adm-data:IsViewOnly()` 

* [x] disable UI elements that are still visible in ViewOnly Mode.

  

## May 31 - Adding DBReadOnly indicators to UI

* [x] add READONLY to login panel
* [x] add READONLY to select model, hide Create Model
* [x] add READONLY REVIEW MODE to ViewMain, hide Comment and Inquiry buttons

* [x] can make export disappear on drag?
* [x] add electron status displays for load import w/ instructions

