export const QUESTION_VERSION = 'rustytoberfest-2026-v1';

export const QUESTIONS = [
  {
    id: 'q01',
    text: 'No Brasil, como é chamada a espuma que fica no topo de um chopp bem servido?',
    options: [
      { id: 'colarinho', text: 'Colarinho' },
      { id: 'gargalo', text: 'Gargalo' },
      { id: 'coroa', text: 'Coroa' },
      { id: 'creme', text: 'Creme' }
    ],
    correctOptionId: 'colarinho'
  },
  {
    id: 'q02',
    text: 'Qual equipamento é normalmente usado em bares para servir o chopp diretamente do barril?',
    options: [
      { id: 'chopeira', text: 'Chopeira' },
      { id: 'coqueteleira', text: 'Coqueteleira' },
      { id: 'decantador', text: 'Decantador' },
      { id: 'espremedor', text: 'Espremedor' }
    ],
    correctOptionId: 'chopeira'
  },
  {
    id: 'q03',
    text: 'Em um boteco brasileiro, qual acompanhamento é tradicionalmente associado a uma rodada de chopp?',
    options: [
      { id: 'petiscos', text: 'Petiscos' },
      { id: 'cereal', text: 'Cereal matinal' },
      { id: 'sorvete', text: 'Sorvete' },
      { id: 'mingau', text: 'Mingau' }
    ],
    correctOptionId: 'petiscos'
  },
  {
    id: 'q04',
    text: 'Qual destas bebidas é normalmente servida diretamente de um barril pressurizado em bares?',
    options: [
      { id: 'chopp', text: 'Chopp' },
      { id: 'caipirinha', text: 'Caipirinha' },
      { id: 'cachaca', text: 'Cachaça de dose' },
      { id: 'vinho', text: 'Vinho de garrafa' }
    ],
    correctOptionId: 'chopp'
  },
  {
    id: 'q05',
    text: 'Qual palavra é muito usada no Brasil para representar o ato de levantar os copos e comemorar com amigos?',
    options: [
      { id: 'brinde', text: 'Brinde' },
      { id: 'coagem', text: 'Coagem' },
      { id: 'maturacao', text: 'Maturação' },
      { id: 'decantacao', text: 'Decantação' }
    ],
    correctOptionId: 'brinde'
  },
  {
    id: 'q06',
    text: 'Para que serve principalmente o colarinho do chopp?',
    options: [
      { id: 'aromas-gas', text: 'Ajuda a preservar aromas e controlar a liberação de gás' },
      { id: 'elimina-alcool', text: 'Elimina completamente o álcool' },
      { id: 'sem-alcool', text: 'Transforma o chopp em cerveja sem álcool' },
      { id: 'aumenta-volume', text: 'Aumenta permanentemente o volume da bebida' }
    ],
    correctOptionId: 'aromas-gas'
  },
  {
    id: 'q07',
    text: 'Em uma chopeira, qual gás é muito utilizado para empurrar o chopp do barril até a torneira e manter sua carbonatação?',
    options: [
      { id: 'co2', text: 'Dióxido de carbono (CO₂)' },
      { id: 'oxigenio', text: 'Oxigênio puro' },
      { id: 'hidrogenio', text: 'Hidrogênio' },
      { id: 'vapor', text: 'Vapor de água' }
    ],
    correctOptionId: 'co2'
  },
  {
    id: 'q08',
    text: 'O que normalmente acontece com um chopp servido em um copo muito quente?',
    options: [
      { id: 'aquece-qualidade', text: 'Aquece mais rapidamente e perde qualidade de serviço' },
      { id: 'mais-alcoolico', text: 'Fica automaticamente mais alcoólico' },
      { id: 'outro-estilo', text: 'Transforma-se em outro estilo de cerveja' },
      { id: 'perde-gas', text: 'Perde instantaneamente todo o gás' }
    ],
    correctOptionId: 'aquece-qualidade'
  },
  {
    id: 'q09',
    text: 'Quando um brasileiro pede um “chopp claro”, geralmente está se referindo a quê?',
    options: [
      { id: 'lager-pilsen', text: 'Um chopp de coloração clara, normalmente associado a estilos Lager ou Pilsen' },
      { id: 'obrigatoriamente-sem-alcool', text: 'Um chopp obrigatoriamente sem álcool' },
      { id: 'misturado-agua', text: 'Um chopp misturado com água' },
      { id: 'sem-malte', text: 'Um chopp feito sem malte' }
    ],
    correctOptionId: 'lager-pilsen'
  },
  {
    id: 'q10',
    text: 'Por que bares precisam higienizar regularmente as linhas da chopeira?',
    options: [
      { id: 'residuos-microrganismos', text: 'Para evitar resíduos e microrganismos que prejudicam sabor e qualidade' },
      { id: 'aumentar-alcool', text: 'Para aumentar artificialmente o teor alcoólico' },
      { id: 'pilsen-ipa', text: 'Para transformar Pilsen em IPA' },
      { id: 'barril-maior', text: 'Para deixar o barril fisicamente maior' }
    ],
    correctOptionId: 'residuos-microrganismos'
  },
  {
    id: 'q11',
    text: 'No Brasil, depois da Instrução Normativa nº 65/2019, “chopp” ou “chope” deixou de ser oficialmente o quê?',
    options: [
      { id: 'denominacao-legal', text: 'Uma denominação legal específica para cerveja não pasteurizada' },
      { id: 'palavra-permitida', text: 'Uma palavra permitida em bares' },
      { id: 'pode-conter-alcool', text: 'Uma bebida que pode conter álcool' },
      { id: 'vendida-barril', text: 'Uma bebida que pode ser vendida em barril' }
    ],
    correctOptionId: 'denominacao-legal'
  },
  {
    id: 'q12',
    text: 'Em um sistema de chopeira, excesso de pressão de CO₂ pode contribuir para qual problema no serviço?',
    options: [
      { id: 'espuma-carbonatacao', text: 'Excesso de espuma e alteração da carbonatação' },
      { id: 'remove-alcool', text: 'Remoção imediata de todo o álcool' },
      { id: 'vira-vinho', text: 'Conversão do chopp em vinho' },
      { id: 'malte-lupulo', text: 'Transformação do malte em lúpulo' }
    ],
    correctOptionId: 'espuma-carbonatacao'
  },
  {
    id: 'q13',
    text: 'Qual destes fatores NÃO deve ser confundido com a causa de um chopp excessivamente espumoso na torneira?',
    options: [
      { id: 'cor-parede', text: 'A cor da parede do bar' },
      { id: 'temperatura', text: 'Temperatura inadequada' },
      { id: 'pressao', text: 'Pressão inadequada' },
      { id: 'linha-torneira', text: 'Problemas na linha ou torneira' }
    ],
    correctOptionId: 'cor-parede'
  },
  {
    id: 'q14',
    text: 'Na linguagem cervejeira, o que significa dizer que um chopp está “oxidado”?',
    options: [
      { id: 'contato-oxigenio', text: 'Que sofreu alterações por contato com oxigênio' },
      { id: 'acucar', text: 'Que recebeu açúcar demais no copo' },
      { id: 'espuma-branca', text: 'Que possui espuma branca' },
      { id: 'abaixo-zero', text: 'Que foi servido abaixo de zero grau' }
    ],
    correctOptionId: 'contato-oxigenio'
  },
  {
    id: 'q15',
    text: 'Historicamente no Brasil, qual característica popularmente diferenciava o “chopp” da cerveja engarrafada tradicional?',
    options: [
      { id: 'sem-pasteurizacao', text: 'A ausência de pasteurização' },
      { id: 'sem-malte-obrigatorio', text: 'A ausência obrigatória de malte' },
      { id: 'sem-alcool-obrigatorio', text: 'A ausência obrigatória de álcool' },
      { id: 'sem-gas', text: 'A ausência completa de gás' }
    ],
    correctOptionId: 'sem-pasteurizacao'
  }
];

export function getQuestionByIndex(index) {
  return QUESTIONS[index] ?? null;
}

export function getQuestionById(id) {
  return QUESTIONS.find(question => question.id === id) ?? null;
}
