import { Participant, VoteResults } from "@/types";

export function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function computeResults(participants: Map<string, Participant>): VoteResults {
  const distribution: Record<string, number> = {};
  const numericVotes: number[] = [];

  for (const p of participants.values()) {
    if (p.vote && !p.isSpectator) {
      distribution[p.vote] = (distribution[p.vote] || 0) + 1;
      const num = parseFloat(p.vote);
      if (!isNaN(num)) {
        numericVotes.push(num);
      }
    }
  }

  const average =
    numericVotes.length > 0
      ? Math.round((numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10) / 10
      : null;

  return { average, distribution };
}
