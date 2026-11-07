'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function gerarManualPDF(caminhoImagem, caminhoSaida) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.pipe(fs.createWriteStream(caminhoSaida));

    // --- TÍTULO ---
    doc.fillColor('#1b5e20')
       .fontSize(18)
       .text('Manual de Preenchimento: Relatórios Financeiros', { align: 'center' })
       .moveDown(0.5);

    doc.fillColor('#333333')
       .fontSize(10)
       .text('Instruções passo a passo para emissão dos 3 relatórios de duplicatas e recebimentos utilizando a tela de Títulos a Receber/Pagar.', { align: 'center' })
       .moveDown(1);

    // --- IMAGEM DA TELA ---
    if (fs.existsSync(caminhoImagem)) {
        doc.image(caminhoImagem, {
            fit: [500, 240],
            align: 'center',
            valign: 'center'
        }).moveDown(1);
    }

    doc.moveDown(1);

    // --- ESTILOS DE TABELA/BLOCO ---
    const desenharSecao = (titulo, configuracoes) => {
        doc.fillColor('#1b5e20')
           .fontSize(12)
           .text(titulo, { underline: true })
           .moveDown(0.3);

        doc.fillColor('#000000').fontSize(9);

        configuracoes.forEach(item => {
            doc.font('Helvetica-Bold').text(`• ${item.campo}: `, { continued: true })
               .font('Helvetica').text(item.valor);
        });

        doc.moveDown(0.8);
    };

    // --- RELATÓRIO 1 ---
    desenharSecao('1. Duplicatas Vencidas entre 01/10/2025 e 31/12/2025 (Data-Base: 30/09/2026)', [
        { campo: 'Tipo', valor: 'Contas a Receber' },
        { campo: 'Status', valor: 'Abertos' },
        { campo: 'Vencimento de / até', valor: '01/10/2025 a 31/12/2025' },
        { campo: 'Data-Base', valor: '30/09/2026' },
        { campo: 'Pagamento de / até', valor: 'Em branco (não preencher)' },
        { campo: 'Observação', valor: 'Retorna os títulos que venceram no 4º trim/2025 e continuavam pendentes em 30/09/2026.' }
    ]);

    // --- RELATÓRIO 2 ---
    desenharSecao('2. Duplicatas Vencidas entre 01/07/2021 e 30/09/2021 (Data-Base: 30/09/2026)', [
        { campo: 'Tipo', valor: 'Contas a Receber' },
        { campo: 'Status', valor: 'Abertos' },
        { campo: 'Vencimento de / até', valor: '01/07/2021 a 30/09/2021' },
        { campo: 'Data-Base', valor: '30/09/2026' },
        { campo: 'Pagamento de / até', valor: 'Em branco (não preencher)' },
        { campo: 'Observação', valor: 'Retorna os títulos antigos do 3º trim/2021 que ainda estavam em aberto em 30/09/2026.' }
    ]);

    // --- RELATÓRIO 3 ---
    desenharSecao('3. Recebimento de Duplicatas (Vencidas até 31/12/2025) no Período de 01/07/2026 a 30/09/2026', [
        { campo: 'Tipo', valor: 'Contas a Receber' },
        { campo: 'Status', valor: 'Liquidados / Baixados' },
        { campo: 'Vencimento de / até', valor: 'Vencimento até: 31/12/2025 (Vencimento de em branco)' },
        { campo: 'Pagamento de / até', valor: '01/07/2026 a 30/09/2026' },
        { campo: 'Data-Base', valor: '30/09/2026' },
        { campo: 'Observação', valor: 'Retorna o total recebido no 3º trim/2026 referente a títulos antigos vencidos até o fim de 2025.' }
    ]);

    // --- RODAPÉ ---
    doc.fontSize(8)
       .fillColor('#777777')
       .text('Gerado automaticamente pelo Sistema de Gestão Financeira.', 40, doc.page.height - 30, { align: 'center' });

    doc.end();
    console.log(`PDF gerado com sucesso em: ${caminhoSaida}`);
}

// Exemplo de execução:
// Substitua pelo caminho exato da imagem salva na sua máquina
gerarManualPDF('./tela_titulos.png', './Manual_Filtros_Relatorios.pdf');