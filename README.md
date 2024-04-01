# MJ Launcher
This is a fairly simple Node.js application that launches Chromium in kiosk mode, points it to my instance of [MJ Images Favorites Downloader](https://github.com/andrewmcdan/MJ-image-favorites-downloader), and monitors it to ensure that the slideshow stays running. It is intended to run on a Raspberry Pi 3/4/5, but surely it can run anything that can run Node.js.

## State of the Project
The scope of this project is was limited to simply getting a slideshow on the screen, and seeing as how it successfully does that with a reasonably high level of reliability, I call this project complete. Below are some quality of life goals that I might one day work on for the sake of this being an open source project:
1. Ability to set the address of the MJ Image Favorites Server / whatever you want to point it at
2. Customization of settings through the use of environment variables or ".env" file
3. Customizability of what gets updated on a regular basis

## Setup
This launcher has a few dependencies..
1. Install Chromium, xdotool, and unclutter
```bash
sudo apt install chromium-browser xdotool unclutter
```
2. Fork this repo, then clone your fork (more on why forking is necessary below)
```bash
git clone https://github.com/{yourName}/mj-launcher.git
```
3. Edit the launcher.js file. The address that it is pointed at is hardcoded so you'll have to find the lines with "http://mj-downloader.lan/show?..." and change them to match your environment. *Notably*, check to ensure that your expected resolution exists in the "resolutions" array near the top of the file.
4. Make any other adjustments to the code to suit your needs.
5. Use [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) to run launcher.js. 

You can skip steps 3 and 4 temporarily since the script will pull down any changes automatically. Once you have it running, you can make edits to the launcher.js file, push the changes to your fork, and the script will pull down the changes.

## Running the Script
The script will launch Chromium in kiosk mode and then check to see if the resolution matches one of several listed in an array called "resolutions" in the launcher.js file. This check is necessary because sometimes Chromium doesn't launch into fullscreen mode. It is therefore necessary that you ensure you expected resolution is in this array. If the resolution of Chromium isn't in the array, it restarts Chromium.

The script will restart Chromium each night at midnight.

Unless you disable auto-updates, every 30 minutes, the script runs "git pull" on the source repo (your forked version, or this repo if you simply cloned it). This is done so that changes / updates can be made to the code without having to ssh or remote into the RasPi (or whatever is running it) in order to update. It will also run "sudo apt update" and "sudo apt upgrade -y", and then it will reboot if any updates were installed. I've been running this for quite a while with no issues, but your mileage may vary.

## Contributing
If you want to contribute, submit an issue or a pull request, please feel free to do so. I am always open to suggestions.

## Disclaimer
Use this software at your own risk. Automatically updating the system in the manner that this script does may be considered risky. This entire script is somewhat hacky and, if I'm being honest, is full of jank. So, I make no guarantees that it will work. 