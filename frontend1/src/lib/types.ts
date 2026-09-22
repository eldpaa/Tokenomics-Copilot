export type WhaleSignal = "DUMP pressure detected" | "Accumulation signal" | "Neutral";

export interface RiskScoreBreakdown {
  ownershipPoints: number;
  lpLockPoints: number;
  holderConcentrationPoints: number;
  whalePoints: number;
  securityPoints?: number;
  dilutionPoints?: number;
  textSignalPoints: number;
  total: number;
  label: string;
}

export interface OwnershipCheck {
  available: boolean;
  renounced: boolean | null;
  ownerAddress: string | null;
  note: string;
}

export interface LiquidityLockCheck {
  available: boolean;
  pairFound: boolean;
  v2BurnedPercent: number | null;
  v2LockedPercent: number | null;
  v2TotalSecuredPercent: number | null;
  v3PoolFound: boolean;
  note: string;
}

export interface HolderConcentrationCheck {
  available: boolean;
  top10Percent: number | null;
  totalHolders: number | null;
  note: string;
}

export interface WhaleSignalItem {
  address: string;
  netFlowPct: number;
  signal: "DUMP" | "ACCUMULATE";
  txCount: number;
}

export interface WhaleDetectionCheck {
  available: boolean;
  blocksScanned: number;
  largeTransferCount: number;
  topSignals: WhaleSignalItem[];
  dominantSignal: "DUMP_PRESSURE" | "ACCUMULATION" | "NEUTRAL" | "UNAVAILABLE";
  note: string;
}

export interface TokenSecurityCheck {
  available: boolean;
  isHoneypot: boolean | null;
  buyTaxPercent: number | null;
  sellTaxPercent: number | null;
  isBlacklisted: boolean | null;
  isMintable: boolean | null;
  canTakeBackOwnership: boolean | null;
  isOpenSource: boolean | null;
  note: string;
}

export interface TokenFinancialMetrics {
  available: boolean;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  circulatingSupply: number | null;
  dilutionRatio: number | null;
  dilutionRisk: "LOW" | "MODERATE" | "HIGH" | "UNAVAILABLE";
  liquidityUsd: number | null;
  pairAddress: string | null;
  dexName: string | null;
  note: string;
}

export interface AnomalySignals {
  ownership: OwnershipCheck;
  liquidityLock: LiquidityLockCheck;
  holderConcentration: HolderConcentrationCheck;
  whaleActivity: WhaleDetectionCheck;
  securityChecks?: TokenSecurityCheck;
  financialMetrics?: TokenFinancialMetrics;
}

export interface AuditResult {
  tokenKey: string;
  name: string;
  symbol: string;
  address: string;
  totalSupply: string;
  whitepaperOk: boolean;
  status: "success" | "failed";
  auditText: string;
  onChainSignals: AnomalySignals | null;
  riskScore: RiskScoreBreakdown | null;
  timestamp: string;
}

export interface BatchStatus {
  status: "idle" | "processing" | "done";
  progress: number; // 0-100
}

export type TokenAuditResult = AuditResult;