export interface ParsedMilestone {
  description: string;
  payout_weight: number;
  is_completed: boolean;
}

export interface ParsedIntent {
  type: "send" | "escrow" | "release" | "refund";
  amount?: string;
  asset?: string;
  recipient?: string;
  milestoneIndex?: number;
  escrowId?: string;
  milestones: ParsedMilestone[];
}

export function parseAiIntent(input: string): ParsedIntent {
  const normalized = input.trim();
  const lower = normalized.toLowerCase();

  // 1. Determine Type
  let type: "send" | "escrow" | "release" | "refund" = "send";
  if (lower.includes("release")) {
    type = "release";
  } else if (lower.includes("refund") || lower.includes("claim back") || lower.includes("reclaim")) {
    type = "refund";
  } else if (lower.includes("escrow") || lower.includes("milestone") || lower.includes("lock")) {
    type = "escrow";
  }

  const result: ParsedIntent = {
    type,
    milestones: [],
  };

  // 2. Extract Recipient (Stellar address: G followed by 55 alphanumeric characters)
  const stellarAddressRegex = /\b(G[A-Z2-7]{55})\b/i;
  const addressMatch = normalized.match(stellarAddressRegex);
  if (addressMatch) {
    result.recipient = addressMatch[1];
  }

  // 3. Extract Escrow ID (hex string, e.g. 64 hex chars or preceded by 0x)
  const escrowIdRegex = /\b(0x)?[0-9a-f]{64}\b/i;
  const escrowIdMatch = normalized.match(escrowIdRegex);
  if (escrowIdMatch) {
    result.escrowId = escrowIdMatch[0];
  } else {
    // Fallback to smaller hex chunks if explicitly mentioned as escrow id
    const fallbackHexRegex = /\b(0x)?[0-9a-f]{8,64}\b/i;
    const fallbackMatch = normalized.match(fallbackHexRegex);
    if (fallbackMatch && (lower.includes("escrow") || lower.includes("id"))) {
      result.escrowId = fallbackMatch[0];
    }
  }

  // 4. Extract Milestone Index (for release)
  const milestoneIndexRegex = /(?:milestone|index|milestone\s*#)\s*(\d+)/i;
  const indexMatch = normalized.match(milestoneIndexRegex);
  if (indexMatch) {
    result.milestoneIndex = parseInt(indexMatch[1], 10);
  }

  // 5. Extract Amount & Asset
  // Example patterns: "50 XLM", "100.50 USDC", "$100 USD"
  // Let's filter out percentages and basis points when matching amount
  const amountAssetRegex = /\b(\d+(?:\.\d+)?)\s*(xlm|usdc|usd|php|ars|mock\s+php|yxlm)\b/i;
  const amountAssetMatch = normalized.match(amountAssetRegex);
  if (amountAssetMatch) {
    result.amount = amountAssetMatch[1];
    result.asset = amountAssetMatch[2].toUpperCase();
  } else {
    // Try matching general first number that is not a percentage or index
    const numbers = normalized.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers) {
      for (const num of numbers) {
        // Ensure this number is not part of a percentage or milestone index
        const idx = normalized.indexOf(num);
        const post = normalized.slice(idx + num.length, idx + num.length + 5).trim();
        const pre = normalized.slice(Math.max(0, idx - 10), idx).toLowerCase();
        if (!post.startsWith("%") && !post.toLowerCase().startsWith("bps") && !post.toLowerCase().startsWith("basis") && !pre.includes("milestone") && !pre.includes("index")) {
          result.amount = num;
          break;
        }
      }
    }
    
    // Try matching asset separately if we found amount
    const assetRegex = /\b(xlm|usdc|usd|php|ars|mock\s+php|yxlm)\b/i;
    const assetMatch = normalized.match(assetRegex);
    if (assetMatch) {
      result.asset = assetMatch[1].toUpperCase();
    }
  }

  // 6. Extract Milestones
  // Let's look for explicit milestones:
  // E.g., "30% for design, 70% for backend" or "UI (30%), backend (70%)"
  const milestonesList: ParsedMilestone[] = [];
  
  // Find all percentage or bps mentions in the text
  const percentPattern = /(\d+(?:\.\d+)?)\s*%\s*(?:for|on|to)?\s*([a-z0-9\s_-]+)/gi;
  const percentPatternAlt = /([a-z0-9\s_-]+)\s*(?:for|on|to)?\s*(\d+(?:\.\d+)?)\s*%/gi;
  const bpsPattern = /(\d+)\s*(?:bps|basis points)\s*(?:for|on|to)?\s*([a-z0-9\s_-]+)/gi;
  const bpsPatternAlt = /([a-z0-9\s_-]+)\s*(?:for|on|to)?\s*(\d+)\s*(?:bps|basis points)/gi;

  let match;
  
  // We'll reset regexes and run them
  percentPattern.lastIndex = 0;
  while ((match = percentPattern.exec(normalized)) !== null) {
    const weight = Math.round(parseFloat(match[1]) * 100);
    const desc = match[2].replace(/^(and|then|with|a|the)\s+/i, "").trim();
    if (desc && !desc.toLowerCase().includes("escrow") && !desc.toLowerCase().includes("milestone")) {
      milestonesList.push({
        description: desc,
        payout_weight: weight,
        is_completed: false,
      });
    }
  }

  if (milestonesList.length === 0) {
    percentPatternAlt.lastIndex = 0;
    while ((match = percentPatternAlt.exec(normalized)) !== null) {
      const desc = match[1].replace(/^(and|then|with|a|the)\s+/i, "").trim();
      const weight = Math.round(parseFloat(match[2]) * 100);
      if (desc && !desc.toLowerCase().includes("escrow") && !desc.toLowerCase().includes("milestone")) {
        milestonesList.push({
          description: desc,
          payout_weight: weight,
          is_completed: false,
        });
      }
    }
  }

  if (milestonesList.length === 0) {
    bpsPattern.lastIndex = 0;
    while ((match = bpsPattern.exec(normalized)) !== null) {
      const weight = parseInt(match[1], 10);
      const desc = match[2].replace(/^(and|then|with|a|the)\s+/i, "").trim();
      if (desc && !desc.toLowerCase().includes("escrow") && !desc.toLowerCase().includes("milestone")) {
        milestonesList.push({
          description: desc,
          payout_weight: weight,
          is_completed: false,
        });
      }
    }
  }

  if (milestonesList.length === 0) {
    bpsPatternAlt.lastIndex = 0;
    while ((match = bpsPatternAlt.exec(normalized)) !== null) {
      const desc = match[1].replace(/^(and|then|with|a|the)\s+/i, "").trim();
      const weight = parseInt(match[2], 10);
      if (desc && !desc.toLowerCase().includes("escrow") && !desc.toLowerCase().includes("milestone")) {
        milestonesList.push({
          description: desc,
          payout_weight: weight,
          is_completed: false,
        });
      }
    }
  }

  // Fallback: If milestones are mentioned without percentages/weights, e.g. "with milestones: design, development"
  if (milestonesList.length === 0 && (lower.includes("milestone") || lower.includes("escrow"))) {
    // Look for parts after keywords like "milestones:", "milestones of", "with milestones"
    const milestoneSectionMatch = normalized.match(/(?:milestones:?|milestones of|with milestones)\s*([^.]+)/i);
    if (milestoneSectionMatch) {
      const items = milestoneSectionMatch[1]
        .split(/,|\band\b|\bthen\b/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().includes("escrow") && !s.toLowerCase().includes("milestone"));
      
      if (items.length > 0) {
        const equalWeight = Math.floor(10000 / items.length);
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
          const isLast = i === items.length - 1;
          const weight = isLast ? (10000 - sum) : equalWeight;
          sum += weight;
          milestonesList.push({
            description: items[i],
            payout_weight: weight,
            is_completed: false,
          });
        }
      }
    }
  }

  // Adjust total weight to exactly 10000 if needed (fixing minor rounding errors)
  if (milestonesList.length > 0) {
    const totalWeight = milestonesList.reduce((sum, m) => sum + m.payout_weight, 0);
    if (totalWeight !== 10000 && totalWeight > 0) {
      // Re-scale proportionately to sum to exactly 10000
      let runningSum = 0;
      for (let i = 0; i < milestonesList.length; i++) {
        if (i === milestonesList.length - 1) {
          milestonesList[i].payout_weight = 10000 - runningSum;
        } else {
          const scaled = Math.round((milestonesList[i].payout_weight / totalWeight) * 10000);
          milestonesList[i].payout_weight = scaled;
          runningSum += scaled;
        }
      }
    }
  }

  result.milestones = milestonesList;

  return result;
}
