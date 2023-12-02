const { spawn } = require('child_process');

// Define the path to the Chromium browser
const chromiumPath = '/usr/bin/chromium-browser';

// Define the options for launching Chromium
const options = [
    '--noerrdialogs',
    '--disable-infobars',
    '--kiosk',
    'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
];

// Launch Chromium
const chromium = spawn(chromiumPath, options);

chromium.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

chromium.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

chromium.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
