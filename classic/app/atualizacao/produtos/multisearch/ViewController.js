Ext.define('SamosAdmin.atualizacao.produtos.multisearch.ViewController', {
    extend: 'SamosWidgets.multisearch.ViewController',
    alias: 'controller.produtosmultisearch',

    onImportarClick: function(btn, e) {
        this.finalizarSelecao();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            conteudo: vm.get('valueConteudo'),
            ordem: vm.get('valueOrdem'),
            status: vm.get('valueStatus')
        };
    },

    onBeforeItemClick: Ext.emptyFn,

    onSelectionChange: function (selectionModel, records) {
        const inativos = records.filter(record => record.get('PRODUTOS_STATUS') == 'F');
        const semPreco = records.filter(record => {
            return (
                record.get('SALDOS_ID') <= 0 || 
                cents(record.get('SALDOS_PRECO') <= 0)
            );
        });

        if(inativos.length > 0){
            selectionModel.deselect(inativos);
            Ext.Note('warning', 'Produto inativo');
        } else if(semPreco.length > 0){
            selectionModel.deselect(inativos);
            Ext.Note('warning', 'Produto sem preço');
        }
    },

    finalizarSelecao: function (record) {
        const vm = this.getViewModel();
        const registrosDaPagina = this.getView().down('grid').getSelectionModel().getSelection();
        const registrosOutrasPaginas = vm.get('registrosOutrasPaginas');
        const registrosSelecionados = record ? [record] : registrosDaPagina.concat(registrosOutrasPaginas);
        
        if(!registrosSelecionados[0]) {
            Ext.Note('warning', 'Selecione pelo menos um item');
            return;
        }
        
        this.getView().initGauge();
        this.executeCallback(null, registrosSelecionados);
        Ext.defer(this.onSairClick, 100, this);
    },

    afterLoadMainStore: function(store, records) {
        var grid = this.getView().down('grid');

        this.callParent(arguments);

        const isMovimento = Ext.$('formmovimentos')[0] ? true : false;
        let tipoCusto = '';
        let tipoPessoa = '';

        if(isMovimento) {
            const form = Ext.$('formmovimentos')[0];            
            const movimento = form.getViewModel().get('model') || [];
            tipoPessoa = movimento.get('PESSOAS_TIPO');
            tipoCusto  = configs.getPessoas().tipoCusto;    
        }

        (records || []).forEach(record => {
            Ext.Object.merge(record.data, record.get('SALDOS')[0]);
            Ext.Object.merge(record.data, record.get('NCMS')[0]);
            delete record.data['SALDOS'];
            delete record.data['NCMS'];

            if(tipoPessoa == tipoCusto && tipoCusto != '') {
                const preco = cents(record.data['SALDOS_CUSTO']);
                record.data['SALDOS_PRECO'] = preco / 100;
                record.data['SALDOS_PRAZO'] = preco / 100;
                record.data['SALDOS_PRECOMINIMO'] = preco / 100;
            } else {            
                const preco = cents(record.data[configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']);

                if(configs.getMovimentos().descontoMaximo != 'SALDOS_PRECOMINIMO') {
                    if(
                        configs.getUsuario().privilegiado && 
                        configs.getMovimentos().senhaDescontoPrivilegiado === false
                    ) {
                        record.data['SALDOS_PRECOMINIMO'] = 0;
                    } else {
                        record.data['SALDOS_PRECOMINIMO'] = (preco - parseInt(preco * (configs.getMovimentos().descontoMaximo || 100) / 100)) / 100
                    }
                }
            }
                                                
            record.data['SALDOS_DEPOSITO'] = (record.data['SALDOSGERAL'] || []).filter(saldo => {
                return (saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i);
            }).reduce((total, saldo) => {
                return total += saldo['SALDOS_DISPONIVEL'];
            }, 0);

            record.data['SALDOS'] = record.data['SALDOSGERAL'];
        });

        grid.reconfigure(grid.getStore());
    }
});
