const { execSync } = require('child_process');

console.clear();
console.log("==================================================");
console.log("💀 [Joshua Lucifer]: Beginning low-memory extraction...");
console.log("==================================================");

// Auto-confirm the Corepack download prompt to prevent hanging
const env = { 
    ...process.env, 
    COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' 
};

try {
    // Force Yarn to install using only 1 download stream (uses almost zero memory)
    execSync('yarn install --production --network-concurrency 1 --non-interactive', { 
        stdio: 'inherit',
        env: env // Passes the auto-confirm environment variable
    });
    console.log("\n==================================================");
    console.log("💀 [Joshua Lucifer]: SUCCESS! All packages downloaded safely.");
    console.log("==================================================");
} catch (err) {
    console.log("\n==================================================");
    console.log("💀 [Joshua Lucifer]: Fallback installation method...");
    console.log("==================================================");
    try {
        // Fallback to npm with extreme low-memory limits
        execSync('npm install --production --no-audit --no-fund --maxsockets 1', { 
            stdio: 'inherit',
            env: env 
        });
        console.log("\n💀 [Joshua Lucifer]: SUCCESS! (Fallback completed)");
    } catch (fallbackErr) {
        console.error("💀 Installation failed entirely:", fallbackErr);
    }
}