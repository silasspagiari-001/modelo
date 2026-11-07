/**
 * Parser de arquivo CNAB400 - RETORNO - Banco do Brasil (Cobrança)
 * ------------------------------------------------------------------
 * Converte um arquivo-texto CNAB400 (400 bytes por linha) em JSON.
 *
 * As posições abaixo foram conferidas linha a linha contra um arquivo
 * de retorno real do usuário (registros tipo 0, 7, 5 e 9) — não é o
 * layout "clássico" de manual genérico, é o layout que o BB realmente
 * está enviando (o que inclui QR Code Pix no registro auxiliar "5").
 *
 * Estrutura observada no arquivo real:
 *   tipo "0" -> header (1 por arquivo)
 *   tipo "7" -> detalhe do título (1 por título)
 *   tipo "5" -> detalhe auxiliar (QR Code Pix / nº do boleto), aparece
 *               logo depois do registro "7" a que se refere — nem todo
 *               título tem um
 *   tipo "9" -> trailer (1 por arquivo)
 *
 * Campos do registro "7" ainda não confirmados (não precisei deles
 * para o objetivo atual, então não quis "inventar" posição): nome do
 * sacado (não aparece nesse tipo de retorno), valor efetivamente pago
 * quando diferente do valor do título, motivo detalhado da ocorrência.
 * Se precisar de algum desses, me manda que a gente localiza junto,
 * comparando mais linhas do seu arquivo.
 */

const fs = require('fs');

// ---------------------------------------------------------------------------
// Utilidades de baixo nível (fixed-width)
// ---------------------------------------------------------------------------

/** Extrai um campo de posição fixa. start/end são 1-indexados e inclusivos. */
function slice(line, start, end) {
  return line.substring(start - 1, end).trim();
}

/** Converte campo de data DDMMAA -> ISO 8601. Retorna null se zerado/vazio. */
function parseDateDDMMAA(str) {
  if (!str || /^0*$/.test(str)) return null;
  const dd = str.substring(0, 2);
  const mm = str.substring(2, 4);
  const aa = str.substring(4, 6);
  const yyyy = Number(aa) <= 69 ? `20${aa}` : `19${aa}`;
  return `${yyyy}-${mm}-${dd}`;
}

/** Converte campo de data DDMMAAAA (8 dígitos, usado no registro "5") -> ISO 8601. */
function parseDateDDMMAAAA(str) {
  if (!str || /^0*$/.test(str) || str.length < 8) return null;
  const dd = str.substring(0, 2);
  const mm = str.substring(2, 4);
  const yyyy = str.substring(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

/** Converte campo numérico com 2 casas decimais implícitas para número em reais. */
function parseValor(str) {
  if (!str) return 0;
  const n = parseInt(str, 10);
  if (Number.isNaN(n)) return 0;
  return n / 100;
}

function parseInteiro(str) {
  const n = parseInt(str, 10);
  return Number.isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// Tabela de códigos de ocorrência (padrão FEBRABAN, confirmado no arquivo real
// pelos códigos 02, 06, 10 e 28 encontrados)
// ---------------------------------------------------------------------------

const OCORRENCIAS = {
  '02': 'Confirmação de entrada de título',
  '03': 'Confirmação de pedido de alteração de dados',
  '06': 'Liquidação normal',
  '09': 'Baixado automaticamente via arquivo',
  '10': 'Baixado conforme instruções da empresa',
  '11': 'Título em ser (não pago)',
  '12': 'Abatimento concedido',
  '13': 'Abatimento cancelado',
  '14': 'Vencimento alterado',
  '15': 'Liquidação em cartório',
  '17': 'Liquidação após baixa ou título não registrado',
  '19': 'Confirmação de recebimento de instrução de protesto',
  '20': 'Confirmação de recebimento de instrução para sustar protesto',
  '23': 'Remessa a cartório',
  '24': 'Retirada de cartório e manutenção em carteira',
  '25': 'Protestado e baixado',
  '26': 'Instrução rejeitada',
  '27': 'Confirmação do pedido de alteração de outros dados',
  '28': 'Débito de tarifas/custas',
  '29': 'Ocorrências do sacado',
  '30': 'Alteração de dados rejeitada',
  '32': 'Instrução rejeitada',
};

function parseDetalhe(line) {
  const codigoOcorrencia = slice(line, 109, 110);
  return {
//  nossoNumero: slice(line, 64, 80), // 17 posições (do jeito abaixo fica mais fácil)
    nossoNumero: parseInteiro(slice(line, 72, 80)), // 9 posições convertido pra integer
    codigoOcorrencia,
    descricaoOcorrencia: OCORRENCIAS[codigoOcorrencia] || `Ocorrência ${codigoOcorrencia} (não mapeada)`,
    dataOcorrencia: parseDateDDMMAA(slice(line, 111, 116)),
    dataVencimento: parseDateDDMMAA(slice(line, 147, 152)),
    valorTitulo: parseValor(slice(line, 153, 165)),
    numeroSequencialRegistro: parseInteiro(slice(line, 395, 400)),
  };
}

/**
 * @param {string} conteudo - conteúdo bruto do arquivo CNAB400 (texto)
 * @returns {{ header: object, titulos: object[], trailer: object, avisos: string[] }}
 */
function parseArquivo(conteudo) {

  const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim().length > 0);

  const titulos = [];

  for (const linha of linhas) {

      if (slice(linha, 1, 1) !== '7')
          continue;

      titulos.push(parseDetalhe(linha));
  }

  return titulos;

}

/** Lê um arquivo do disco e devolve o JSON já convertido. */
function parseArquivoDeCaminho(caminho, encoding = 'latin1') {
  // 'latin1' porque arquivos CNAB do BB costumam vir em ISO-8859-1 (acentos, "Ç" etc.)
  const conteudo = fs.readFileSync(caminho, { encoding });
  return parseArquivo(conteudo);
}

module.exports = {
  parseArquivo,
  parseArquivoDeCaminho,
  parseDetalhe,
  OCORRENCIAS,
};
