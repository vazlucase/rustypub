export const START_ATTEMPT_SCRIPT = `
local participant = redis.call('GET', KEYS[1])
local device = redis.call('GET', KEYS[2])
if participant or device then
  if participant and device and participant == device then return {'resume', participant} end
  return {'blocked', participant or device}
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[2])
redis.call('HSET', KEYS[3],
  'status', 'active', 'name', ARGV[3], 'questionVersion', ARGV[4],
  'nextIndex', '0', 'score', '0', 'results', '', 'createdAt', ARGV[5],
  'deadlineAt', ARGV[6], 'lastAnswerKey', '')
redis.call('EXPIRE', KEYS[3], ARGV[2])
redis.call('SET', KEYS[4], ARGV[1], 'EX', ARGV[2])
return {'created', ARGV[1]}
`;

export const ANSWER_SCRIPT = `
local status = redis.call('HGET', KEYS[1], 'status')
if not status then return {'missing'} end
if status ~= 'active' then return {'finished'} end
local nextIndex = tonumber(redis.call('HGET', KEYS[1], 'nextIndex') or '0')
if nextIndex ~= tonumber(ARGV[1]) then return {'stale', tostring(nextIndex)} end
local lastAnswerKey = redis.call('HGET', KEYS[1], 'lastAnswerKey') or ''
if lastAnswerKey == ARGV[2] then return {'duplicate', tostring(nextIndex)} end
local score = tonumber(redis.call('HGET', KEYS[1], 'score') or '0')
local results = redis.call('HGET', KEYS[1], 'results') or ''
if ARGV[3] == '1' then score = score + 1; results = results .. '1' else results = results .. '0' end
local newIndex = nextIndex + 1
redis.call('HSET', KEYS[1], 'score', tostring(score), 'results', results,
  'nextIndex', tostring(newIndex), 'lastAnswerKey', ARGV[2], 'deadlineAt', ARGV[4])
if newIndex < tonumber(ARGV[5]) then return {'active', tostring(newIndex), tostring(score), results} end
local finalStatus = 'finished'
local rank = ''
if score == tonumber(ARGV[5]) then
  local winnerCount = tonumber(redis.call('GET', KEYS[2]) or '0')
  if winnerCount < tonumber(ARGV[6]) then
    rank = tostring(redis.call('INCR', KEYS[2]))
    finalStatus = 'winner'
    redis.call('ZADD', KEYS[3], ARGV[7], ARGV[8])
    redis.call('HSET', KEYS[4], 'attemptId', ARGV[8], 'rank', rank, 'status', 'issued', 'issuedAt', ARGV[7])
  else
    finalStatus = 'perfect_nonwinner'
  end
end
redis.call('HSET', KEYS[1], 'status', finalStatus, 'finishedAt', ARGV[7], 'winnerRank', rank, 'ticketHash', ARGV[9])
return {finalStatus, tostring(newIndex), tostring(score), results, rank}
`;

export const REDEEM_TICKET_SCRIPT = `
local status = redis.call('HGET', KEYS[1], 'status')
if not status then return {'invalid'} end
if ARGV[1] == 'verify' then
  return {status, redis.call('HGET', KEYS[1], 'rank') or '', redis.call('HGET', KEYS[1], 'issuedAt') or '', redis.call('HGET', KEYS[1], 'redeemedAt') or ''}
end
if status == 'redeemed' then
  return {'redeemed', redis.call('HGET', KEYS[1], 'rank') or '', redis.call('HGET', KEYS[1], 'issuedAt') or '', redis.call('HGET', KEYS[1], 'redeemedAt') or ''}
end
redis.call('HSET', KEYS[1], 'status', 'redeemed', 'redeemedAt', ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
redis.call('HDEL', KEYS[2], 'name')
return {'redeemed_now', redis.call('HGET', KEYS[1], 'rank') or '', redis.call('HGET', KEYS[1], 'issuedAt') or '', ARGV[2]}
`;
