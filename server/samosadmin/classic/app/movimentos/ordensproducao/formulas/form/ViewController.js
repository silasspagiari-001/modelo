Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordensproducaoformulas',

    prepararProduto: async function(txt, record) {
        const selection = this.lookup('produtos').getSelection();

        if(!selection){ return; }

        const produto = selection.getValues();
        const custo   = cents(record.get('SALDOS_CUSTO')); // Preço para produção

        produto['FORMULASITENS_QUANTIDADE'] = 1;
        produto['FORMULASITENS_PERCENTUAL'] = 'F';
        produto['FORMULASITENS_CUSTO']      = custo / 100;
        produto['VALOR_TOTAL']              = custo / 100; // 100;

        selection.setValues(produto);

        Ext.asap(() => txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form')));
    },

    calcularProduto: async function(txt, griditems) {
        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();
        
        //const qtdeIncompleta = produto['FORMULASITENS_QUANTIDADE'].toString().slice(-1) == '.'   ||
        //                       produto['FORMULASITENS_QUANTIDADE'].toString().slice(-2) == '.0'  ||
        //                       produto['FORMULASITENS_QUANTIDADE'].toString().slice(-3) == '.00';
        //
        //if(qtdeIncompleta) { return; }
        
        const qtde  = configs.getClientName() === 'malacrida' ? toPrecision(produto['FORMULASITENS_QUANTIDADE'],6) / 1000
                                                              : grams(produto['FORMULASITENS_QUANTIDADE']);

        const percentual   = produto['FORMULASITENS_PERCENTUAL'];
        const custo        = toPrecision(produto['SALDOS_CUSTO'], 4);//toPrecision(produto['SALDOS_TRANSFERENCIA'], 4);
        const totalBruto   = percentual == 'T' ? 
                             Math.round(qtde * custo / 100 / 1000 / 100) :
                             Math.round(qtde * custo / 100 / 1000);

        produto['FORMULASITENS_CUSTO'] = custo      / 10000; 
        produto['VALOR_TOTAL']         = totalBruto / 100; //100;

        selection.setValues(produto);

       Ext.asap(() => txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form')));

       Ext.asap(() => this.calcularTotal());
    },

    calcularTotal: function() {

        const produtos = this.lookup('produtos').getStore().data.items;

        const total = produtos.reduce((total, produto) => {
            return total += grams(produto.get('VALOR_TOTAL'));
        }, 0);

        this.getRecord().set('VALOR_TOTAL', total / 1000);  // 1000);
    },

    onImprimirClick: async function () {
        const view = this.getView();

        try {

            view.initGauge('Gerando impressão...');

            const model = this.getRecord();

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/formulas`,
                method: 'GET',
                query: {
                    idproduto  : model.get('PRODUCOESFORMULAS_ID_PRODUTOS'),
                    empresacnpj: configs.getEmpresa().cnpj
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    }    
});