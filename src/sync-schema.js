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
if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir);
}

const config = {
    sourceUrl: process.env.SOURCE_URL,
    sourceToken: process.env.SOURCE_TOKEN,
    destUrl: process.env.DESTINATION_URL,
    destToken: process.env.DESTINATION_TOKEN,
    sourceSnapshotFile: path.join(snapshotsDir, 'source.schema.snapshot.json'),
    destSnapshotFile: path.join(snapshotsDir, 'destination.schema.snapshot.json'),
    diffFile: path.join(snapshotsDir, 'schema-diff.json'),
};

async function sync() {
    try {
        console.log(`Exporting schema from source (${config.sourceUrl})...`);
        const sourceSnapshot = await fetchJson(`${config.sourceUrl}/schema/snapshot?export=json`, config.sourceToken);
        fs.writeFileSync(config.sourceSnapshotFile, JSON.stringify(sourceSnapshot, null, 2));
        console.log(`Snapshot saved to ${config.sourceSnapshotFile}`);

        console.log(`Exporting schema from destination (${config.destUrl})...`);
        const destSnapshot = await fetchJson(`${config.destUrl}/schema/snapshot?export=json`, config.destToken);
        fs.writeFileSync(config.destSnapshotFile, JSON.stringify(destSnapshot, null, 2));
        console.log(`Snapshot saved to ${config.destSnapshotFile}`);

        console.log(`Comparing snapshot with destination schema...`);
        // Directus snapshot might be wrapped in { data: ... } or return the object directly
        const snapshotBody = sourceSnapshot.data || sourceSnapshot;

        const diffResponse = await fetchJson(
            `${config.destUrl}/schema/diff`,
            config.destToken,
            'POST',
            snapshotBody
        );

        // Save only the 'data' object (the actual diff) if it exists, otherwise the whole response
        // Directus /schema/diff returns { data: { ... } } or just the diff depending on version/context, usually wrapped in data.
        const diffData = diffResponse.data ? diffResponse.data : diffResponse;

        fs.writeFileSync(config.diffFile, JSON.stringify(diffData, null, 2));
        console.log(`Diff saved to ${config.diffFile} (data wrapper processed)`);

    } catch (error) {
        console.error("Sync failed:", error.message);
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

    return await response.json();
}

sync();
