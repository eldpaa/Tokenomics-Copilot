import * as child_process from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";

const execAsync = promisify(child_process.exec);

const MOCK_GREENFIELD = true;

const GREENFIELD_BUCKET = "tokenomics-reports";
const GREENFIELD_GROUP_ID = "vip-reports";
const OUTPUT_DIR = import.meta.dir + "/output";

const processingWallets = new Set<string>();

// ─── Input Validation Helpers ───────────────────────────────────────────────

function validateWalletAddress(walletAddress: string): void {
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
        throw new Error("Invalid wallet address format");
    }
}

function validateGroupName(groupName: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(groupName)) {
        throw new Error("Invalid group name format");
    }
}

function validateObjectName(objectName: string): void {
    if (!/^[a-zA-Z0-9_.\-/]+$/.test(objectName)) {
        throw new Error("Invalid object name format");
    }
}

// ─── Jalur A: Access Control (Group Membership) ─────────────────────────────

export async function addGroupMember(groupName: string, walletAddress: string): Promise<boolean> {
    validateWalletAddress(walletAddress);
    validateGroupName(groupName);

    if (processingWallets.has(walletAddress)) {
        throw new Error("This wallet is already being processed. Please wait.");
    }

    processingWallets.add(walletAddress);
    try {
        if (MOCK_GREENFIELD) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log(`[Mock Greenfield] ✅ Added ${walletAddress} to group gnfd://${groupName}`);
            return true;
        } else {
            await execAsync(`gnfd-cmd group update --addMembers ${walletAddress} gnfd://${groupName}`);
            return true;
        }
    } finally {
        processingWallets.delete(walletAddress);
    }
}

// ─── Jalur B: Upload Audit Report to Greenfield ─────────────────────────────

/**
 * Generates a text-based report file from audit data and "uploads" it
 * to BNB Greenfield as a private object.
 *
 * MOCK mode: Saves the file locally to ./output/ and logs success.
 * PROD mode: Runs `gnfd-cmd object put` to upload to the Greenfield bucket.
 */
export async function uploadObject(
    tokenSymbol: string,
    auditText: string,
    riskScore: number,
    timestamp: string
): Promise<{ objectName: string; localPath: string }> {
    const safeSymbol = tokenSymbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const objectName = `${safeSymbol}-audit-report.txt`;
    const localPath = `${OUTPUT_DIR}/${objectName}`;

    // Build the report content
    const reportContent = [
        `═══════════════════════════════════════════════════════`,
        `  TOKENOMICS COPILOT — EXECUTIVE AUDIT REPORT`,
        `  Token: ${safeSymbol}`,
        `  Risk Score: ${riskScore}/100`,
        `  Generated: ${timestamp}`,
        `  Storage: BNB Greenfield (gnfd://${GREENFIELD_BUCKET}/${objectName})`,
        `═══════════════════════════════════════════════════════`,
        ``,
        auditText,
        ``,
        `═══════════════════════════════════════════════════════`,
        `  END OF REPORT — Stored on BNB Greenfield`,
        `  Bucket: ${GREENFIELD_BUCKET}`,
        `  Visibility: Private (VIP Group Access Only)`,
        `═══════════════════════════════════════════════════════`,
    ].join("\n");

    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) await mkdir(OUTPUT_DIR, { recursive: true });

    // Write file locally (needed for both mock and prod)
    await writeFile(localPath, reportContent, "utf-8");

    if (MOCK_GREENFIELD) {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log(`[Mock Greenfield] 📄 Uploaded ${objectName} to gnfd://${GREENFIELD_BUCKET}/${objectName} (private)`);
        console.log(`[Mock Greenfield]    Local file saved: ${localPath}`);
    } else {
        validateObjectName(objectName);
        await execAsync(
            `gnfd-cmd object put --visibility private "${localPath}" gnfd://${GREENFIELD_BUCKET}/${objectName}`
        );
        console.log(`[Greenfield] 📄 Uploaded ${objectName} to gnfd://${GREENFIELD_BUCKET}/${objectName}`);
    }

    return { objectName, localPath };
}

// ─── Jalur B: Grant Read Access to VIP Group ────────────────────────────────

/**
 * Grants read (get) permission on a specific object in the Greenfield bucket
 * to the VIP group, so that members of the group can download the report.
 *
 * MOCK mode: Logs the simulated policy grant.
 * PROD mode: Runs `gnfd-cmd policy put` to grant on-chain access.
 */
export async function grantObjectAccess(
    objectName: string,
    groupName: string = GREENFIELD_GROUP_ID
): Promise<boolean> {
    validateObjectName(objectName);
    validateGroupName(groupName);

    if (MOCK_GREENFIELD) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[Mock Greenfield] 🔓 Granted READ access on gnfd://${GREENFIELD_BUCKET}/${objectName} to group "${groupName}"`);
        return true;
    } else {
        await execAsync(
            `gnfd-cmd policy put --groupId ${groupName} --actions get grn:o::${GREENFIELD_BUCKET}/${objectName}`
        );
        console.log(`[Greenfield] 🔓 Granted READ access on ${objectName} to group "${groupName}"`);
        return true;
    }
}
