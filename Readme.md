[![Analytics](https://ga-beacon.appspot.com/UA-66081238-2/github/readme)](https://github.com/igrigorik/ga-beacon)
<!--[![Analytics](https://ga-beacon.appspot.com/UA-66081238-2/npm/readme)](https://github.com/igrigorik/ga-beacon)-->
#Demandware Utilities

This package provides a command line utility `dw-utils` for managing code on Demandware sites.

## Commands
The binary provides the following commands.

| Command                              | Description                               |
| ---------------------                | :---------------------------------------- |
| `dw-utils clean`                     | Equivalant to a project clean in eclipse  |
| `dw-utils [upload | upload-version]` | Upload a zipped code version to a sandbox |
| `dw-utils init`                      | Interactively enter configuation options  |
| `dw-utils watch`                     | Watch cartridge path and upload changes   |
| `dw-utils log [level]`               | Poll the log file for updates             |

## Credentials

Credentials are stored in a file called `dw.json` in the root of the project.
dw-utils will create such a file if called with the `--save` option, or interactively by calling `dw-utils init`. 


## Flags

The following flags are recognized

| Flag             | Description                                                          |
| ----             | :----------                                                          |
| -V, --version    | Code version to upload to (defaults to 'version1')                   |
| -H, --hostname   | Hostname of remote DW server                                         |
| -u, --username   | Username for WebDav (Same as Business Manager)                       |
| -C, --cartridges | Path to Cartridges from project root (Default is 'cartridges')       |
| --save           | Save settings for future use                                         |
| -S, --stability  | Length of time the file's size should stay the same before uploading |
| -p, --prompt     | Prompt for password                                                  |
| -h, --help       | Display help and usage details                                       |


# Command Details

## Clean

> **Usage:** `dw-utils clean`

This is Equivalant to a project clean that you would run in eclipse. It zips up all local files, and uploads them to 
the dw instance specified on the command line with `-H`, or in `dw.json` if it was previously set up. then all the old
code in the apropriate version is deleted, and the zip file is unzipped. This ensures that the files on the remote
are exactly the same as the ones on the client.

## Upload 

> **Usage:** `dw-utils upload [version.zip]`

This tool can also be invoked as `upload-version` which is longer but slightly more self-explanatory.

Upload a code version zip from another instance. In Business Manager, under **Code Deployment** click on the version 
you want to download, and click the **Download** link. This will download a zip file of the code for that version
which can be uploaded using this tool.


## Init

> **Usage:** `dw-utils init`

Interactively enters configuration for the repository and stores it in `dw.json`. Make sure to ignore this file in
source controll.

## Watch

> **Usage:** `dw-utils watch`

Watch for changes to files in the `cartridge` directory and upload them. 
This uploader will bulk upload files if there are more than 5 waiting to be uploaded, which results in very fast uploads
even when there are a lot of changes. 

**NOTE:** if you have stability issues or encounter a lot of errors, try upping the `--stability` flag.

## Log
> **Usage:** `dw-utils log [level]`

`level` specifies the logging level, usually one of `[debug,warn,eror,fatal]`, but will work with any custom error
logging as well. Upon startup, the command will automatically find the most recently updated log file with a name
matching the `level`. The log file is polled at the interval set with `-i --interval` with a default of 5s. 

**NOTE:** this will not show changes to log files created while `dw-utils` was running, so if the log file your are looking at
rolls over to a new date, or if there is no log yet for the current day, it will not find it while running. You will
have to exit out of the `dw-utils log` and restart it to catch the new file.
