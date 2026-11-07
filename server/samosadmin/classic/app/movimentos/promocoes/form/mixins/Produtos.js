Ext.define('SamosAdmin.movimentos.promocoes.form.mixins.Produtos', {
    extend: 'Ext.app.ViewController',

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();
        if(!selection){ return; }

        const model = this.getRecord();
        const produto = selection.getValues();

        produto['PROMOCOESITENS_CUSTOTECNICO'] = 0 ;//model.get('PROMOCOES_CUSTOTECNICO');
        produto['PROMOCOESITENS_DESCONTO']     = model.get('PROMOCOES_DESCONTO');
        produto['PROMOCOESITENS_EMPRESAS']     = model.get('PROMOCOES_EMPRESAS');
        produto['PROMOCOESITENS_INDICE']       = model.get('PROMOCOES_INDICE');
        produto['PROMOCOESITENS_PARCELAS']     = model.get('PROMOCOES_PARCELAS');
        produto['PROMOCOESITENS_VALOR']        = record.get('SALDOS_PRECO');
        produto['SALDOS_PRECO']                = record.get('SALDOS_PRECO');
        produto['PRECOMINIMO_DB']              = record.get('PRECOMINIMO_DB');
        
        const custoTecnico = 0; //grams(produto['PROMOCOESITENS_CUSTOTECNICO']);
        const preco        = cents(produto['SALDOS_PRECO']);
        const precoMinimo  = cents(record.get('SALDOS_PRECOMINIMO'));

        if(custoTecnico > 0){
            produto['PROMOCOESITENS_VALOR']    = parseInt((precoMinimo + ((precoMinimo * custoTecnico) / 1000 / 100)) / 100);
            produto['PROMOCOESITENS_DESCONTO'] = (100000 - grams((cents(produto['PROMOCOESITENS_VALOR']) / preco) * 100)) / 1000;
        } else {
            const desconto = grams(produto['PROMOCOESITENS_DESCONTO']);

            produto['PROMOCOESITENS_VALOR'] = parseInt((preco - (preco * desconto / 1000 / 100)) / 100);

            if(cents(produto['PROMOCOESITENS_VALOR']) < precoMinimo) {
                produto['PROMOCOESITENS_VALOR']    = precoMinimo / 100;
                produto['PROMOCOESITENS_DESCONTO'] = (100000 - grams(precoMinimo / preco * 100)) / 1000;
            }
        }

        selection.setValues(produto);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    calcularProduto: async function(txt, griditems) {
        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();
        
        produto['TOTALPARCELAS_ITENS'] = parseInt(cents(produto['PROMOCOESITENS_VALOR']) * coefs(produto['PROMOCOESITENS_INDICE']) * parseInt(produto['PROMOCOESITENS_PARCELAS']) / 100 / 10000);

        selection.setValues(produto);
    }
});