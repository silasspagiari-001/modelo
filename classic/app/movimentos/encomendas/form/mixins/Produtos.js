Ext.define('SamosAdmin.movimentos.encomendas.form.mixins.Produtos', {
    extend: 'Ext.app.ViewController',

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();
        if(!selection){ return; }

        const model = this.getRecord();
        const txtQtde = txt.up('form').down('field[reference^="qtde"]');
        const produto = selection.getValues();
        let preco = 0;
        
        produto['MOVIMENTOSITENS_ID_OPERACOES'] = model.get('MOVIMENTOS_ID_OPERACOES');
        produto['OPERACOES_NOME']               = model.get('OPERACOES_NOME');
        
        if(configs.getMovimentos().tipoPreco == 'vista') {
            preco = cents(record.get('SALDOS_PRECO'));
        } else {
            preco = cents(record.get('SALDOS_PRAZO'));
        }

        produto['MOVIMENTOSITENS_QUANTIDADE'] = (produto['MOVIMENTOSITENS_QUANTIDADE'] == 0 ? 1 : produto['MOVIMENTOSITENS_QUANTIDADE']);
        produto['MOVIMENTOSITENS_PRECO']      = preco / 100;
        produto['MOVIMENTOSITENS_TOTAL']      = preco / 100;
        produto['TOTAL_LIQUIDO']              = preco / 100;

        txtQtde.suspendEvents();

        selection.setValues(produto);
        Ext.defer(txtQtde.resumeEvents, 50, txtQtde);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    calcularProduto: async function(txt, griditems) {
        if(txt && txt.name == 'MOVIMENTOSITENS_TOTAL'){ return true; }

        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();
        const qtdeIncompleta =  produto['MOVIMENTOSITENS_QUANTIDADE'].toString().slice(-1) == '.'   ||
                                produto['MOVIMENTOSITENS_QUANTIDADE'].toString().slice(-2) == '.0'  ||
                                produto['MOVIMENTOSITENS_QUANTIDADE'].toString().slice(-3) == '.00';

        if(qtdeIncompleta) { return; }
        
        const qtde       = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        const preco      = cents(produto[configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']);
        const totalBruto = qtde * preco / 1000;

        produto['MOVIMENTOSITENS_TOTAL'] = totalBruto / 100;
        produto['MOVIMENTOSITENS_PRECO'] = preco      / 100;

        selection.setValues(produto);
    },

    fazerSomasERateios: function(txt) {
        this.iniciarEdicao();

        const vm = this.getViewModel();
        const movimento = this.getRecord();
        const produtos = vm.getStore('produtos').data.items;
        const somaTotalBrutoProdutos = produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_TOTAL'));
        }, 0);

        movimento.set({
            'MOVIMENTOS_PRODUTOS'  : somaTotalBrutoProdutos / 100,
            'MOVIMENTOS_TOTAL'     : somaTotalBrutoProdutos / 100
        });
    }
});