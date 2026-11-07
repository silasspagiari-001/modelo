Ext.define('SamosAdmin.processos.entradas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',  
    alias: 'controller.formprocessosentradas',

    initViewModel: function(vm) {  
        setTimeout(() => {        
            const idProdutosAnt   = vm.get('model.MOVIMENTOSITENS_ID_PRODUTOS');            
            vm.get('model').set({
                'MOVIMENTOSITENS_ID_PRODUTOSANTIGO'    : idProdutosAnt,
            });
        }, 1000);
    },

    onNovoClick: async function (btn, event) {
        const movimento = this.getRecord();        
        const record = Ext.create('SamosAdmin.processos.entradas.Model'); 
        
        record.set({
            'MOVIMENTOS_ID'                : movimento.get('MOVIMENTOS_ID'),
            'MOVIMENTOSITENS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'),
            'MOVIMENTOSITENS_PRECO'        : 0.01,
            'MOVIMENTOSITENS_TOTAL'        : 0.01,
            'MOVIMENTOSITENS_ID_OPERACOES' : movimento.get('MOVIMENTOSITENS_ID_OPERACOES'),
            'MOVIMENTOS_NUMERO'            : movimento.get('MOVIMENTOS_NUMERO'),
            'MOVIMENTOS_SERIE'             : movimento.get('MOVIMENTOS_SERIE'),
            'MOVIMENTOS_EMISSAO'           : movimento.get('MOVIMENTOS_EMISSAO'),
            'MOVIMENTOS_ENTRADASAIDA'      : movimento.get('MOVIMENTOS_ENTRADASAIDA'),
            'MOVIMENTOS_NOME'              : movimento.get('MOVIMENTOS_NOME')
        });

        this.getViewModel().set({
            'hideNovo':    true,
            'readOnly':       false,
            'initialValues':  {},
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          record,
            'listName':       'processosentradas'    
        });

        this.getView().lookup('quantidade').focus(true);
    },

    onGravarClick: async function (btn, event) {
        const view = this.getView();

        try {
            const model = this.getRecord();

            if(!this.validarLoteProduto()) {
                throw 'Lote com produto diferente - Corrigir Lote';
            }

            await this.validarCabecalho();

            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                view.initGauge();
                const record = await model.save();
                this.onGravacaoSucesso(record);
            }
             
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao gravar o ajuste');
        }

        view.stopGauge();
    },

    onSairClick: function(btn, event) {
        this.callParent(arguments);
        
        if(this.getListView()) {
            this.getListView( ).getController( ).onBuscarClick();
        }
    },

    validarLoteProduto: function() {
        const movimento = this.getRecord();
        const idProduto = movimento.get('MOVIMENTOSITENS_ID_PRODUTOS');
        const idLote    = movimento.get('MOVIMENTOSITENS_ID_LOTES');
        const idProdutoLote = movimento.get('LOTES_ID_PRODUTOS');

        if(parseInt(idLote) > 0) { // Se tem lote
           if(idProduto != idProdutoLote) {
               return false
           }
        }
        return true;
    },

});
