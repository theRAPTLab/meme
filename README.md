# MEME Boilerplate

Boilerplate for Electron-hosted LAN-based Web Learning System!

At this time, Electron userland "easy to get started" tools are not production-ready. We're building our own starting point rather than use _electron-forge_ and similar tools. This will allow us to develop understanding of best practices of the underlying tools (e.g. webpack) for using the Electron library.

## Directory Configuration

- [x] .babelrc auto include react presets
- [x] .editorconfig to enforce spacing/tab rules
- [x] .gitignore
- [x] .eslintrc.json to enforce AirBNB linting rules
- [x] .nvmrc to enforce required Node version
- [x] .prettierrc to configure wrapping options

## Development Tasks

#### BUILD STAGE

- [x] build ElectronApp bundle
- [x] build WebApp bundle, served from ElectronApp

#### DEVELOPMENT STAGE

- [x] [build]
- [ ] run ElectronApp w/ livereload of main.js (mainprocess under nodemon)
- [x] mainprocess: load renderer processes w/ livereload of electron bundle
- [x] mainprocess: launch WebApp Server (Express)
- [x] mainprocess: launch WebApp Sockets (UNISYS)
- [x] WebApp Server: watch for livereload of webapp bundle

#### PACKAGE STAGE [WIP]

- [x] [build]
- [x] create electron package installer
- [x] build standalone mac app
