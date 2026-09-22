import { config } from "dotenv";
config();

import { daftarToken, auditSatuToken, jalankanBatchLengkap } from "./core.ts";

async function jalankanSatuToken(namaTarget: string) {
    if (!daftarToken[namaTarget]) {
        console.log(`❌ ERROR: Token '${namaTarget}' not found in database!`);
        console.log(`Available tokens: ${Object.keys(daftarToken).join(", ")}`);
        return;
    }

    console.log(`\n======================================================`);
    console.log(`🚀 AUDITING SINGLE TOKEN: ${namaTarget}`);
    console.log(`======================================================`);

    try {
        const hasil = await auditSatuToken(namaTarget);
        console.log(`------------------------------------------------------`);
        console.log(hasil.auditText);
        if (hasil.riskScore) {
            console.log(`\n======================================================`);
            console.log(`RISK SCORE: ${hasil.riskScore.total}/100 ${hasil.riskScore.label}`);
            console.log(`======================================================`);
            console.log(`  Ownership          : ${hasil.riskScore.ownershipPoints >= 0 ? "+" : ""}${hasil.riskScore.ownershipPoints}`);
            console.log(`  LP Lock            : ${hasil.riskScore.lpLockPoints >= 0 ? "+" : ""}${hasil.riskScore.lpLockPoints}`);
            console.log(`  Holder Concentration: ${hasil.riskScore.holderConcentrationPoints >= 0 ? "+" : ""}${hasil.riskScore.holderConcentrationPoints}`);
            console.log(`  Whale Signal       : ${hasil.riskScore.whalePoints >= 0 ? "+" : ""}${hasil.riskScore.whalePoints}`);
            console.log(`  Sinyal Teks Audit  : ${hasil.riskScore.textSignalPoints >= 0 ? "+" : ""}${hasil.riskScore.textSignalPoints}`);
        }
        console.log(`\n🎉 AUDIT COMPLETED!\n`);
    } catch (error: any) {
        console.log(`❌ FAILED to process token: ${error.message}`);
    }
}

async function jalankanBatch(resume: boolean) {
    console.log(`\n======================================================`);
    console.log(`🚀 INITIATING BATCH AUDIT FOR ALL TOKENS ${resume ? "(RESUME MODE)" : ""}`);
    console.log(`======================================================`);

    const { hasil, tierList } = await jalankanBatchLengkap(resume, (msg) => console.log(msg));

    if (tierList) {
        console.log(`\n======================================================`);
        console.log(`📑 PORTFOLIO TIER LIST SUMMARY`);
        console.log(`======================================================\n`);
        console.log(tierList);
    }

    console.log(`\n🎉 ALL AUDIT PROCESSES COMPLETED! Hasil lengkap tersimpan di ./output/batch-result.json (total: ${hasil.length})\n`);
}

// --- LOGIKA BACA PERINTAH TERMINAL ---
const args = process.argv.slice(2);
const targetToken = args[0] ? args[0].toUpperCase() : null;
const resumeFlag = args.includes("--resume");

if (targetToken === "ALL") {
    jalankanBatch(resumeFlag);
} else if (targetToken) {
    jalankanSatuToken(targetToken);
} else {
    console.log("⚠️ PENGGUNAAN SALAH.");
    console.log("Untuk audit 1 token : bun run index.ts <NAMA_TOKEN> (Contoh: bun run index.ts CYBER)");
    console.log("Untuk audit semua   : bun run index.ts ALL");
    console.log("Untuk resume batch  : bun run index.ts ALL --resume");
    console.log(`Token tersedia      : ${Object.keys(daftarToken).join(", ")}`);
}