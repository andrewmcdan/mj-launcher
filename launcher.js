const { spawn } = require('child_process');

// Define the path to the Chromium browser
const chromiumPath = '/usr/bin/chromium-browser';

// Define the options for launching Chromium
const chromiumOptions = [
    '--noerrdialogs',
    '--disable-infobars',
    '--kiosk',
    'http://mj-downloader.lan:3001/show?enableAutoAdjustUpdateInterval=false&updateInterval=11&fadeDuration=3.5'
];

// Set up the environment variables, including DISPLAY
const env = Object.create(process.env);
env.DISPLAY = ':0';

// Launch Chromium with the specified environment
const chromium = spawn(chromiumPath, chromiumOptions, { env });

chromium.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

chromium.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

chromium.on('close', (code) => {
    console.log(`Chromium process exited with code ${code}`);
});
