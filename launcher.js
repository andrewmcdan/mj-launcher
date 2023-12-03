// code written by ChatGPT
const { spawn } = require('child_process');

// Set up the environment variables, including DISPLAY
const env = Object.create(process.env);
env.DISPLAY = ':0';


class Launcher {
    constructor() {
        this.chromiumPath = '/usr/bin/chromium-browser';
        this.chromiumOptions = [
            '--noerrdialogs',
            '--disable-infobars',
            '--kiosk',
            'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
        ];
        this.env = Object.create(process.env);
        this.env.DISPLAY = ':0';
        this.running = false;
        this.timeToRestart = 0;
        this.runTimeout = null;
        this.chromium = null;
        this.run();
    }

    start() {
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
            this.run();
        }, timeUntilRestart);
    }

    run() {
        if (this.running) {
            // kill chromium
            this.chromium.kill();
        }
        this.running = true;
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
        this.start();
    }
};

let launcher = new Launcher();
launcher.start();