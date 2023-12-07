// code written by ChatGPT
const { spawn } = require('child_process');

// Set up the environment variables, including DISPLAY
const env = Object.create(process.env);
env.DISPLAY = ':0';

class Launcher {
    constructor() {
        this.chromiumPath = '/usr/bin/chromium-browser';

        this.env = Object.create(process.env);
        this.env.DISPLAY = ':0';
        this.running = false;
        this.timeToRestart = 0;
        this.timeToRestartEnabled = true;
        this.runTimeout = null;
        this.chromium = null;
        this.optionsUptdate = null;
        this.enableAutoAdjustUpdateInterval = false;
        this.updateInterval = 11;
        this.fadeDuration = 3.5;
        this.showPrompt = false;
        this.chromiumOptions = [
            '--noerrdialogs',
            '--disable-infobars',
            '--kiosk',
            'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=' + (this.enableAutoAdjustUpdateInterval ? 'true' : 'false') + '&updateInterval=' + this.updateInterval + '&fadeDuration=' + this.fadeDuration + '&showPrompt=' + (this.showPrompt ? 'true' : 'false')
            //'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
        ];
        this.optionsModified = false;

        this.optionsUptdate = setInterval(() => {
            this.updateOptions();
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
        if (this.running) {
            // kill chromium
            this.chromium.kill();
            process.kill(this.chromium.pid);
            spawn('killall', ['chromium-browser']);
            await waitSeconds(1);
        }
        this.running = true;
        this.chromiumOptions = [
            '--noerrdialogs',
            '--disable-infobars',
            '--kiosk',
            'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=' + (this.enableAutoAdjustUpdateInterval ? 'true' : 'false') + '&updateInterval=' + this.updateInterval + '&fadeDuration=' + this.fadeDuration + '&showPrompt=' + (this.showPrompt ? 'true' : 'false')
            //'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
        ];
        this.chromium = spawn(this.chromiumPath, this.chromiumOptions, { env: this.env });
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
        this.run();
    }

    async updateOptions() {
        let options = await fetch('http://mj-downloader.lan:3001/showOptions').then(res => res.json());
        console.log(options);
        if (options.enableAutoAdjustUpdateInterval !== null && options.enableAutoAdjustUpdateInterval !== undefined) this.enableAutoAdjustUpdateInterval = options.enableAutoAdjustUpdateInterval;
        if (options.updateInterval !== null && options.updateInterval !== undefined) this.updateInterval = options.updateInterval;
        if (options.fadeDuration !== null && options.fadeDuration !== undefined) this.fadeDuration = options.fadeDuration;
        if (options.showPrompt !== null && options.showPrompt !== undefined) this.showPrompt = options.showPrompt;
        if (options.timeToRestart !== null && options.timeToRestart !== undefined) this.timeToRestart = options.timeToRestart;
        if (options.timeToRestartEnabled !== null && options.timeToRestartEnabled !== undefined) this.timeToRestartEnabled = options.timeToRestartEnabled;
        if (this.optionsModified) {
            this.optionsModified = false;
            this.startRestart();
        }
    }
};

class AptManager {
    constructor() {
        this.updateCheckInterval = 1000 * 60 * 30; // 30 minutes
        this.updateTimeout = null;
        this.updateProc = null;
        this.upgradeProc = null;
        this.gitProc = null;
        this.gitInProgress = false;
        this.procOutput = "";
        this.checkForUpdate();
    }

    async checkForUpdate() {
        if (this.updateTimeout !== null) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            this.checkForUpdate();
        }, this.updateCheckInterval);

        this.gitProc = spawn('git', ['pull'], { cwd: '/home/pi/mj-launcher' });
        this.gitInProgress = true;
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
                console.log('git pull up to date');
            } else {
                console.log('git pull updated');
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
let aptManager = new AptManager();
launcher.run();