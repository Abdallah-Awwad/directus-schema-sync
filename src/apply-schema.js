const fs = require('fs');
const path = require('path');

// --- Load Env --- //
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line) return; // Skip empty lines
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = value;
        }
    });
} else {
    console.warn(".env file not found. Ensure environment variables are set.");
}

const snapshotsDir = path.join(__dirname, '../snapshots');

const config = {
    destUrl: process.env.DESTINATION_URL,
    destToken: process.env.DESTINATION_TOKEN,
    diffFile: path.join(snapshotsDir, 'schema-diff.json'),
};

async function apply() {
    try {
        console.log(`Applying schema to destination (${config.destUrl})...`);

        if (!fs.existsSync(config.diffFile)) {
            throw new Error(`Diff file ${config.diffFile} not found. Run sync first.`);
        }

        const diffContent = JSON.parse(fs.readFileSync(config.diffFile, 'utf8'));

        await fetchJson(
            `${config.destUrl}/schema/apply`,
            config.destToken,
            'POST',
            diffContent
        );

        console.log("Destination schema now matches source!");

    } catch (error) {
        console.error("Apply failed:", error.message);
        process.exit(1);
    }
}

async function fetchJson(url, token, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    // Some endpoints might return 204 No Content
    if (response.status === 204) return null;

    return await response.json();
}

apply();
