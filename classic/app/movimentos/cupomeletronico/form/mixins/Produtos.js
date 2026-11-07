Ext.define('SamosAdmin.movimentos.cupomeletronico.form.mixins.Produtos', {
    extend: 'Ext.app.ViewController',

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();

        if(!selection){ return; }

        if(!record) {
            txt.focus(true);
            txt.reset();
            return Ext.Note('warning', 'Produto não encontrado');
        }

        const movimento = this.getRecord();
        const txtQtde = txt.up('form').down('field[reference^="qtde"]');
        const produto = selection.getValues();
        const preco = cents(record[configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']);

        produto['MOVIMENTOSITENS_ID_PRODUTOS']  = record['PRODUTOS_ID'];
        produto['MOVIMENTOSITENS_CST']          = record['SALDOS_CSTLOCAL'];
        produto['MOVIMENTOSITENS_ICMS']         = record['SALDOS_ICMSLC'];
        produto['MOVIMENTOSITENS_ID_OPERACOES'] = movimento.get('MOVIMENTOS_ID_OPERACOES');
        produto['MOVIMENTOSITENS_QUANTIDADE']   = (produto['MOVIMENTOSITENS_QUANTIDADE'] == 0 ? 1 : produto['MOVIMENTOSITENS_QUANTIDADE']);
        produto['SALDOS_PRECO']                 = preco / 100;
        produto['SALDOS_PRAZO']                 = preco / 100;
        produto['MOVIMENTOSITENS_PRECO']        = preco / 100;
        produto['MOVIMENTOSITENS_TOTAL']        = preco / 100;
        produto['TOTAL_LIQUIDO']                = preco / 100;
        produto['VALOR_LIQUIDO']                = preco / 100;
        produto['MOVIMENTOSITENS_PERCENTUAL']   = 0;
        produto['MOVIMENTOSITENS_DESCONTOS']    = 0;
        produto['SALDOS_DISPONIVEL']            = record['SALDOS_DISPONIVEL'];
        produto['SALDOS_LOCAL']                 = record['SALDOS_LOCAL'];
        produto['PRODUTOS_NOME']                = record['PRODUTOS_NOME'];
        produto['PRODUTOS_DERIVADO']            = record['PRODUTOS_DERIVADO'];
        produto['SALDOS_ICMSLC']                = record['SALDOS_ICMSLC'];
        produto['PRECOMINIMO_DB']               = record['PRECOMINIMO_DB'];

        txtQtde.suspendEvents();
        txtQtde.focus(true);

        movimento.data['MOVIMENTOS_ITENS'] = movimento.data['MOVIMENTOS_ITENS'] || [];

        const produtos = movimento.data['MOVIMENTOS_ITENS'];
        
        let indexProduto = produtos.findIndex(item => item['MOVIMENTOSITENS_ID'] == produto['MOVIMENTOSITENS_ID']);

        if(indexProduto == -1) {
            //vai incrementando valores negativos a partir de -2 e salvando no localstorage
            //novos produtos tem sempre MOVIMENTOSITENS_ID negativos e consecutivos
            produto['MOVIMENTOSITENS_ID'] = localStorage.getItem('idNovoProduto') || -2;
            localStorage.setItem('idNovoProduto', produto['MOVIMENTOSITENS_ID'] - 1);
        }

        selection.setValues(produto);

        setTimeout(async () => txtQtde.resumeEvents(), 200);

        //insere/atualiza o produto nos itens do model
        indexProduto = produtos.findIndex(item => item['MOVIMENTOSITENS_ID'] == produto['MOVIMENTOSITENS_ID']);

        if(indexProduto != -1) {
            movimento.data['MOVIMENTOS_ITENS'][indexProduto] = produto;//atualiza
        } else {
            movimento.data['MOVIMENTOS_ITENS'].push(produto);//insere
        }

        this.atualizarCalculos(txt);
    }
});