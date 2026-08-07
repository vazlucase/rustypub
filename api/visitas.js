import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const CHAVE_TOTAL = 'rustypub:visitas:total';
const JANELA_RATE_LIMIT_SEGUNDOS = 30;

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET' && request.method !== 'POST') {
    return response.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    // GET apenas lê o total, sem incrementar — usado para exibir o número
    // em páginas que não devem contar como nova visita (ex: admin, preview).
    if (request.method === 'GET') {
      const total = (await redis.get(CHAVE_TOTAL)) ?? 0;
      return response.status(200).json({ total: Number(total) });
    }

    // POST incrementa — é o que o site chama a cada visita real.
    // Rate-limit simples por IP: evita que um refresh rápido ou um script
    // simples infle o contador. Usa o IP como parte da chave, com TTL curto.
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      'desconhecido';
    const chaveRateLimit = `rustypub:visitas:rl:${ip}`;

    const jaVisitouRecentemente = await redis.get(chaveRateLimit);

    if (jaVisitouRecentemente) {
      // Não conta de novo, mas devolve o total atual pra UI não ficar travada.
      const total = (await redis.get(CHAVE_TOTAL)) ?? 0;
      return response.status(200).json({ total: Number(total), contado: false });
    }

    // Marca esse IP como "já contado" pelos próximos N segundos.
    await redis.set(chaveRateLimit, '1', { ex: JANELA_RATE_LIMIT_SEGUNDOS });

    const novoTotal = await redis.incr(CHAVE_TOTAL);

    return response.status(200).json({ total: novoTotal, contado: true });
  } catch (erro) {
    console.error('Erro no contador de visitas:', erro);
    return response.status(500).json({ erro: 'Falha ao acessar o contador' });
  }
}
