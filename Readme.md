#Demandware Utilities

This package provides a command line utility `dw-utils` for managing code on Demandware sites.

## Commands
The binary provides the following commands.

| Command           | Description                               |
| ---------------   | :---------------------------------------- |
| `dw-utils clean`  | Equivalant to a project clean in eclipse  |
| `dw-utils upload` | Upload a zipped code version to a sandbox |
| `dw-utils init`   | Interactively enter configuation options  |
## Credentials

Credentials are stored in a file called `dw.json` in the root of the project.
dw-utils will create such a file if called with the `--save` option, or interactively by calling `dw-utils init`. 


## Flags

The following flags are recognized

| Flag             | Description                                                    |
| ----             | :----------                                                    |
| -V, --version    | Code version to upload to (defaults to 'version1')             |
| -H, --hostname   | Hostname of remote DW server                                   |
| -u, --username   | Username for WebDav (Same as Business Manager)                 |
| -C, --cartridges | Path to Cartridges from project root (Default is 'cartridges') |
| --save           | Save settings for future use                                   |
| -p, --prompt     | Prompt for password                                            |
| -h, --help       | Display help and usage details                                 |
