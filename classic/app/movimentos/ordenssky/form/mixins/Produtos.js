Ext.define('SamosAdmin.movimentos.ordenssky.form.mixins.Produtos', {
    extend: 'Ext.app.ViewController',

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();
        if(!selection){ return; }

        const movimento = this.getRecord();
        const txtQtde = txt.up('form').down('field[reference^="qtde"]');
        const produto = selection.getValues();
        const preco = cents(record.get('SALDOS_PRECO'));

        produto['ORDENSPRODUTOS_ID_OPERACOES'] = movimento.get('ORDENS_ID_OPERACOES');
        produto['ORDENSPRODUTOS_QUANTIDADE']   = (produto['ORDENSPRODUTOS_QUANTIDADE'] == 0 ? 1 : produto['ORDENSPRODUTOS_QUANTIDADE']);
        produto['ORDENSPRODUTOS_PRECO']        = preco / 100;
        produto['ORDENSPRODUTOS_TOTAL']        = preco / 100;

        txtQtde.suspendEvents();

        selection.setValues(produto);
        Ext.defer(txtQtde.resumeEvents, 50, txtQtde);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    calcularProduto: async function(txt, griditems) {
        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();
        const qtdeIncompleta =  produto['ORDENSPRODUTOS_QUANTIDADE'].toString().slice(-1) == '.'   ||
                                produto['ORDENSPRODUTOS_QUANTIDADE'].toString().slice(-2) == '.0'  ||
                                produto['ORDENSPRODUTOS_QUANTIDADE'].toString().slice(-3) == '.00';

        if(qtdeIncompleta) { return; }
        
        const qtde       = grams(produto['ORDENSPRODUTOS_QUANTIDADE']);
        const preco      = toPrecision(produto['SALDOS_PRECO'], 4);
        const totalBruto = Math.round(qtde * preco / 100 / 1000);

        produto['ORDENSPRODUTOS_TOTAL'] = totalBruto / 100;

        selection.setValues(produto);
    }
});