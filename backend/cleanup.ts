import { unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
    const filesToDelete = [
        'check_checksum.js',
        'check_checksum2.js',
        'cek_model.ts'
    ];

    for (const file of filesToDelete) {
        try {
            await unlink(join(__dirname, file));
            console.log(`Deleted ${file}`);
        } catch (e: any) {
            console.log(`Failed to delete ${file}: ${e.message}`);
        }
    }

    const outputDir = join(__dirname, 'output');
    try {
        const outputFiles = await readdir(outputDir);
        for (const file of outputFiles) {
            try {
                await unlink(join(outputDir, file));
                console.log(`Deleted output/${file}`);
            } catch (e: any) {
                console.log(`Failed to delete output/${file}: ${e.message}`);
            }
        }
    } catch (e: any) {
        console.log(`Failed to read output dir: ${e.message}`);
    }

    // self destruct
    try {
        await unlink(__filename);
        console.log("Cleanup script self-destructed.");
    } catch (e) {}
}

main();
