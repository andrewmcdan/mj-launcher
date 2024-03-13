// TODO: add web server for reboot/shutdown and other commands

// much code written by ChatGPT.
const { spawn } = require('child_process');

// Set up the environment variables, including DISPLAY
const env = Object.create(process.env);
env.DISPLAY = ':0';

const resolutions = [
    { width: 4096, height: 2160 },
    { width: 3840, height: 2160 },
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 }
];

class Launcher {
    constructor() {
        this._restartShow = false;
        this._showPrompt = false;
        this._fadeDuration = 3.5;
        this._updateInterval = 11;
        this._enableAutoAdjustUpdateInterval = false;
        this._timeToRestart = 0;
        this._timeToRestartEnabled = true;

        this.chromiumPath = '/usr/bin/chromium-browser';
        this.env = Object.create(process.env);
        this.env.DISPLAY = ':0';
        this.chromium = null;

        this.running = false;
        this.runTimeout = null;

        this.optionsUptdate = null;
        this.timeToRestart = 0;
        this.timeToRestartEnabled = true;
        this.enableAutoAdjustUpdateInterval = false;
        this.updateInterval = 11;
        this.fadeDuration = 3.5;
        this.showPrompt = false;
        this.restartShow = false;

        this.chromiumOptions = [
            '--noerrdialogs',
            '--disable-infobars',
            '--kiosk',
            'http://mj-downloader.lan/show?enableAutoAdjustUpdateInterval=' + (this.enableAutoAdjustUpdateInterval ? 'true' : 'false') + '&updateInterval=' + this.updateInterval + '&fadeDuration=' + this.fadeDuration + '&showPrompt=' + (this.showPrompt ? 'true' : 'false')
            //'http://mj-downloader.lan/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
        ];
        this.optionsModified = false;

        this.optionsUptdate = setInterval(() => {
            this.updateOptions();
        }, 1000 * 60);

        this.checkForLossOfFullscreen = setInterval(() => {
            this.successfulStartCheck().then(success => {
                if (!success) {
                    console.log('Chromium lost fullscreen. Restarting...');
                    this.startRestart();
                }
            });
        }, 1000 * 60);

        this.startRestart();
    }

    // #region
    get timeToRestart() {
        return this._timeToRestart;
    }

    set timeToRestart(value) {
        if (value != this._timeToRestart) this.optionsModified = true;
        this._timeToRestart = value;
    }

    get enableAutoAdjustUpdateInterval() {
        return this._enableAutoAdjustUpdateInterval;
    }

    set enableAutoAdjustUpdateInterval(value) {
        if (value != this._enableAutoAdjustUpdateInterval) this.optionsModified = true;
        this._enableAutoAdjustUpdateInterval = value;
    }

    get updateInterval() {
        return this._updateInterval;
    }

    set updateInterval(value) {
        if (value != this._updateInterval) this.optionsModified = true;
        this._updateInterval = value;
    }

    get fadeDuration() {
        return this._fadeDuration;
    }

    set fadeDuration(value) {
        if (value != this._fadeDuration) this.optionsModified = true;
        this._fadeDuration = value;
    }

    get showPrompt() {
        return this._showPrompt;
    }

    set showPrompt(value) {
        if (value != this._showPrompt) this.optionsModified = true;
        this._showPrompt = value;
    }

    get restartShow() {
        return this._restartShow;
    }

    set restartShow(value) {
        if (value) this.optionsModified = true;
        this._restartShow = value;
    }
    //#endregion

    run() {
        if (this.runTimeout !== null) {
            clearTimeout(this.runTimeout);
        }
        let now = new Date();
        let timeToRestart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.timeToRestart / 60, this.timeToRestart % 60, 0, 0);
        let timeUntilRestart = timeToRestart - now;
        if (timeUntilRestart < 0) {
            timeUntilRestart += 1000 * 60 * 60 * 24;
        }
        this.runTimeout = setTimeout(() => {
            if (this.timeToRestartEnabled) this.startRestart();
        }, timeUntilRestart);
    }

    async startRestart() {
        this.restartShow = false;
        if (this.running) {
            // kill chromium
            this.chromium.kill();
            process.kill(this.chromium.pid);
            spawn('killall', ['chromium-browser']);
            await waitSeconds(2);
            spawn('rm', ['-R', '/home/andrew/.config/chromium/Default/Cache']);
            spawn('rm', ['-rf', '~/.config/chromium/Singleton*']);
            await waitSeconds(2);
        }
        this.running = true;
        this.chromiumOptions = [
            '--noerrdialogs',
            '--disable-infobars',
            '--kiosk',
            'http://mj-downloader.lan/show?enableAutoAdjustUpdateInterval=' + (this.enableAutoAdjustUpdateInterval ? 'true' : 'false') + '&updateInterval=' + this.updateInterval + '&fadeDuration=' + this.fadeDuration + '&showPrompt=' + (this.showPrompt ? 'true' : 'false')
            //'http://mj-downloader.lan/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
        ];
        this.chromium = spawn(this.chromiumPath, this.chromiumOptions, { env: this.env });
        spawn('unclutter', ['-idle', '0.01', '-root']);
        // spawn('xdotool', ['mousemove', '0', '0']);
        spawn('xdotool', ['mousemove_relative', '--', '-1920', '-1080'], { env: this.env });
        this.restartShow = false;
        this.chromium.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        this.chromium.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        this.chromium.on('close', (code) => {
            console.log(`Chromium process exited with code ${code}`);
            this.running = false;
        });
        await waitSeconds(5);
        this.successfulStartCheck().then(async (success) => {
            if (!success) {
                console.log('Chromium failed to start in fullscreen mode. Trying again...');
                await waitSeconds(5);
                this.startRestart();
            }
        });
        this.run();
    }

    successfulStartCheck(env = null) {
        return new Promise((resolve, reject) => {
            this.env = Object.create(process.env);
            if (env !== null && env.DISPLAY !== null && env.DISPLAY !== undefined) this.env.DISPLAY = env.DISPLAY;
            let wmctrl = spawn('wmctrl', ['-lG'], { env: this.env });
            wmctrl.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
                if (data.includes('Chromium')) {
                    let lines = data.toString().split('\n');
                    let chromiumLine = lines.find(line => line.includes('Chromium'));
                    let regex = /\s+(\d+)\s+(\d+)\s+mj-show/g;
                    let match = regex.exec(chromiumLine);
                    regex = /(\d+)\s+(\d+)/g;
                    match = regex.exec(match[0]);
                    let resolution = { width: parseInt(match[1]), height: parseInt(match[2]) };
                    // console.log(resolution);
                    resolve(this.containsResolution(resolution));
                }
            });
            wmctrl.stderr.on('data', (data) => {
                // console.error(`stderr: ${data}`);
                if (data.includes('Cannot open display') && env === null) {
                    resolve(this.successfulStartCheck({ DISPLAY: ':0' }));
                }
            });
            wmctrl.on('close', async (code) => {
                // console.log(`wmctrl process exited with code ${code}`);
                await waitSeconds(2);
                resolve(false);
            });
        });
    }

    containsResolution(target) {
        const targetWidth = target.width;
        const targetHeight = target.height;
        // console.log("target width x height: " + targetWidth + 'x' + targetHeight)

        let found = resolutions.some(resolution => {
            return ((resolution.width === targetWidth) && (resolution.height === targetHeight));
        });
        // console.log("found: " + found);
        return found;
    }

    async updateOptions() {
        let options = await fetch('http://mj-downloader.lan/showOptions').then(res => res.json());
        // console.log(options);
        try {
            if (options.enableAutoAdjustUpdateInterval !== null && options.enableAutoAdjustUpdateInterval !== undefined) {
                if (typeof options.enableAutoAdjustUpdateInterval == 'boolean') this.enableAutoAdjustUpdateInterval = options.enableAutoAdjustUpdateInterval;
                else this.enableAutoAdjustUpdateInterval = options.enableAutoAdjustUpdateInterval == 'true' ? true : false;
            }
            if (options.updateInterval !== null && options.updateInterval !== undefined) this.updateInterval = parseInt(options.updateInterval);
            if (options.fadeDuration !== null && options.fadeDuration !== undefined) this.fadeDuration = parseInt(options.fadeDuration);
            if (options.showPrompt !== null && options.showPrompt !== undefined) {
                if (typeof options.showPrompt == 'boolean') this.showPrompt = options.showPrompt;
                else this.showPrompt = options.showPrompt == 'true' ? true : false;
            }
            if (options.timeToRestart !== null && options.timeToRestart !== undefined) this.timeToRestart = parseInt(options.timeToRestart);
            if (options.timeToRestartEnabled !== null && options.timeToRestartEnabled !== undefined) {
                if (typeof options.timeToRestartEnabled == 'boolean') this.timeToRestartEnabled = options.timeToRestartEnabled;
                else this.timeToRestartEnabled = options.timeToRestartEnabled == 'true' ? true : false;
            }
            if (options.restartShow !== null && options.restartShow !== undefined) {
                if (typeof options.restartShow == 'boolean') this.restartShow = options.restartShow;
                else this.restartShow = options.restartShow == 'true' ? true : false;
            }
            if (this.optionsModified) {
                this.optionsModified = false;
                this.startRestart();
            }
        } catch (e) {
            console.log(e);
        }
    }
};

class UpdateManager {
    constructor(launcher) {
        this.updateCheckInterval = 1000 * 60 * 30; // 30 minutes
        this.updateTimeout = null;
        this.updateProc = null;
        this.upgradeProc = null;
        this.gitProc = null;
        this.gitInProgress = false;
        this.procOutput = "";
        this.checkForUpdate();
        this.launcher = launcher;
    }

    async checkForUpdate() {
        if (this.updateTimeout !== null) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            this.checkForUpdate();
        }, this.updateCheckInterval);

        this.procOutput = "";
        this.gitInProgress = true;
        this.gitProc = spawn('git', ['pull'], { cwd: '/home/andrew/mj-launcher' });
        this.gitProc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            this.procOutput += data;
        });
        this.gitProc.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        this.gitProc.on('close', (code) => {
            console.log(`git pull process exited with code ${code}`);
            this.gitInProgress = false;
            if (this.procOutput.includes('Already up to date')) {
                console.log('git pull: up to date');
            } else {
                console.log('git pull: updated');
                spawn('pm2', ['restart', '0'])
            }
        });

        while (this.gitInProgress) {
            await waitSeconds(2);
        }

        this.updateProc = spawn('sudo', ['apt', 'update']);

        this.updateProc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            this.procOutput += data;
        });
        this.updateProc.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        this.updateProc.on('close', (code) => {
            if (this.procOutput.includes('can be upgraded') && !this.procOutput.includes('The following packages have been kept back')) {
                console.log('apt update available');
                this.upgradeProc = spawn('sudo', ['apt', 'upgrade', '-y']);
                this.upgradeProc.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });
                this.upgradeProc.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });
                this.upgradeProc.on('close', (code) => {
                    console.log(`apt upgrade process exited with code ${code}`);
                    spawn('sudo', ['reboot']);
                });
            }
            console.log(`apt update process exited with code ${code}`);
        });
    }
}

function waitSeconds(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

let launcher = new Launcher();
let updateManager = new UpdateManager(launcher);
launcher.run();