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

    startRestart() {
        if (this.running) {
            // kill chromium
            this.chromium.kill();

            let pid = this.chromium.pid;

            // kill chromium's children
            spawn('pkill', ['-P', pid]);
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
        this.enableAutoAdjustUpdateInterval = options.enableAutoAdjustUpdateInterval;
        this.updateInterval = options.updateInterval;
        this.fadeDuration = options.fadeDuration;
        this.showPrompt = options.showPrompt;
        this.timeToRestart = options.timeToRestart;
        this.timeToRestartEnabled = options.timeToRestartEnabled;
        if (this.optionsModified) {
            this.optionsModified = false;
            this.startRestart();
        }
    }
};

let launcher = new Launcher();
launcher.run();