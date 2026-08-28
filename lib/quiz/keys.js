export function quizKeys(campaignId) {
  const prefix = `quiz:{${campaignId}}`;
  return {
    prefix,
    winnerCount: `${prefix}:winner_count`,
    winners: `${prefix}:winners`,
    optionOrderSequence: `${prefix}:option_order_sequence`,
    participant: phoneHash => `${prefix}:participant:${phoneHash}`,
    device: deviceHash => `${prefix}:device:${deviceHash}`,
    attempt: attemptId => `${prefix}:attempt:${attemptId}`,
    session: sessionHash => `${prefix}:session:${sessionHash}`,
    ticket: ticketHash => `${prefix}:ticket:${ticketHash}`,
    rateLimit: (scope, hash) => `${prefix}:rl:${scope}:${hash}`
  };
}
