
Ext.define('SamosAdminModern.orcamentos.services.Email', {
    alternateClassName: 'Orcamento.services.Email',
    singleton: true,

    enviar: async function(view, movimento) {
        const defaultEmail = movimento.get('MOVIMENTOS_EMAIL');

        const email = await SamosUtils.Msg.prompt({
            title       : 'Email', 
            mensagem    : 'Confirme ou digite o email:', 
            initialValue: defaultEmail,
            field       : { upperCased: false }
        });
        
        if(email === false) { return; }//cancelado pelo usuario

        if(!SamosUtils.String.isEmail(email)) {
            throw 'Email inválido';
        }

        const corpo = this.buildHtml(movimento);

        view.initGauge('Enviando email...');

        const pdf    = await this.imprimir(view, movimento);
        const anexos = pdf ? [pdf] : [];
        
        await SamosUtils.Email.enviar({
            emails   : email,
            assunto  : `Orçamento n.º ${movimento.get('MOVIMENTOS_NUMERO')}`,
            template : 'resources/email.html',
            cabecalho: '',
            corpo    : corpo,
            anexos   : anexos
        });

        SamosUtils.Msg.alert('Sucesso', 'Email enviado com sucesso', 2000);
    },

    buildHtml: function(movimento) {
        var products = movimento.get('MOVIMENTOS_ITENS'),
            productsRows = [],
            money = Ext.util.Format.maskRenderer('#9.990,00', true),
            moneyPreco = Ext.util.Format.maskRenderer('#9.990,' + ('0'.repeat(configs.getMovimentos().casasDecimaisPreco || 2)), true),
            th = '<th style="padding:4px;border:1px solid #0f0f0f;" height="20" ',
            td = '<td style="padding:4px;border:1px solid #0f0f0f;" height="20" ',
            html;

        for (var i in products) {
            const qtde = grams(products[i]['MOVIMENTOSITENS_QUANTIDADE']);
            const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;
            const precoInt = toPrecision(products[i]['MOVIMENTOSITENS_PRECO'], casasDecimaisPreco);
            const totalBruto = Math.round(precoInt * qtde / 1000 / Math.pow(10, (casasDecimaisPreco - 2)));

            productsRows.push(`<tr>
                ${td}align="right" width="100px">${products[i]['MOVIMENTOSITENS_ID_PRODUTOS']}</td>
                ${td}align="left"  width="50%"  >${products[i]['PRODUTOS_NOME']}</td>
                ${td}align="right" width="100px">${products[i]['MOVIMENTOSITENS_QUANTIDADE']}</td>
                ${td}align="right" width="120px">${moneyPreco(products[i]['MOVIMENTOSITENS_PRECO'])}</td>
                ${td}align="right" width="120px">${money(totalBruto / 100)}</td>
            </tr>`);
        }

        html = `<table style="font-size:16px;border:1px solid #0f0f0f;border-collapse: collapse;" width="600" >
            <tr>
                ${th}align="left"  width="100px">Nome</th>
                ${td}align="left"  width="50%"  >${movimento.get('MOVIMENTOS_NOME')}</td>
                ${th}align="left"  width="100px">Data</th>
                ${td}align="right" width="2400px" colspan="2">${momentTz(movimento.get('MOVIMENTOS_EMISSAO')).format('DD/MM/YYYY')}</td>
            </tr>
            <tr height="10"></tr>
            <tr>
                ${th}align="right" width="100px">Código</th>
                ${th}align="left"  width="50%"  >Descrição</th>
                ${th}align="right" width="100px">Qtde</th>
                ${th}align="right" width="120px">Preço</th>
                ${th}align="right" width="120px">Total</th>
            </tr>
            ${productsRows.join('')}
            <tr height="10"></tr>
            <tr>
                ${th}align="left"  colspan="2">Observações</th>
                ${th}align="center" width="100px">Frete</th>
                ${th}align="center" width="120px">Descontos</th>
                ${th}align="center" width="120px">Produtos</th>
            </tr>
            <tr>
                ${td}align="left"  colspan="2" rowspan="3">${movimento.get('MOVIMENTOS_OBSERVACOES') || ''}</td>
                ${td}align="right" width="100px">${money(movimento.get('MOVIMENTOS_FRETE'))}</td>
                ${td}align="right" width="120px">${money(movimento.get('MOVIMENTOS_DESCONTOS'))}</td>
                ${td}align="right" width="120px">${money(movimento.get('MOVIMENTOS_PRODUTOS'))}</td>
            </tr>
            <tr>
                ${th}align="center" width="100px">Seguro</th>
                ${th}align="center" width="120px">Despesas</th>
                ${th}align="center" width="120px">Total</th>
            </tr>
            <tr>
                ${td}align="right" width="100px">${money(configs.getMovimentos().usarMarkup ? 0 : movimento.get('MOVIMENTOS_SEGURO'))}</td>
                ${td}align="right" width="120px">${money(movimento.get('MOVIMENTOS_DESPESAS'))}</td>
                ${td}align="right" width="120px">${money(movimento.get('MOVIMENTOS_TOTAL'))}</td>
            </tr>
        </table>`;

        return html;
    },

    imprimir: async function(view, movimento) {
        const queryPDF = await SamosUtils.Request.nodeApi({
            url: `/relatorios/${configs.getClientName()}/orcamentos`,
            method: 'GET',
            query: {
                id            : movimento.get('MOVIMENTOS_ID'),
                empresa       : configs.getEmpresa().id,
                documento     : movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
                numero        : movimento.get('MOVIMENTOS_NUMERO'),
                start         : 0,
                limit         : 1,
                titledocumento: 'Orçamento',
                diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
            }
        });

        return queryPDF.results[0]['name']
    }
});
