Ext.define('SamosAdmin.movimentos.ordenseleve.multisearch.ViewController', {
    extend: 'SamosWidgets.multisearch.ViewController',
    alias: 'controller.ordenselevemultisearch',

    onImportarClick: function(btn, e) {
        this.finalizarSelecao();
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;

        return {
            empresa        : vm.get('multiEmpresa') == undefined ? (configs.getMultiEmpresa() ? '' : configs.getEmpresa().id) : (vm.get('multiEmpresa') ? '' : configs.getEmpresa().id),
            documento      : '', //trazer pelo nome
            nomedocumento  : title,
            numero         : vm.get('valueNumero'),
            pessoa         : vm.get('valueIdPessoa'),
            movimentosnome : vm.get('valuePessoa'),
            inicio         : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
            final          : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
            ordem          : vm.get('valueOrdem'),
            status         : 'X'
        };
    },

    onBeforeItemClick: Ext.emptyFn,

    onSelectionChange: function (selectionModel, records) {
        const permitirApenasDeUmaPessoa = this.getViewModel().get('permitirApenasDeUmaPessoa');
        const permitirApenasDeUmaEmpresa = this.getViewModel().get('permitirApenasDeUmaEmpresa');
        const importaParaNota = this.getView().viewOrigin.getViewModel().get('isNotaEletronica');
        const vendaConsumidor = records.filter(record => record.get('ORDENS_ID_PESSOAS') == record.get('DOCUMENTOS_ID_PESSOAS'))
            
        if(importaParaNota && vendaConsumidor.length) {
            selectionModel.deselect(vendaConsumidor);
            Ext.Note('warning', '<b>Venda Consumidor:</b><br><br>Faça o cadastro do cliente antes de importar essa(s) orden(s)');
            
        } else if(records[0]){
            if(permitirApenasDeUmaPessoa) {
                const primeiraPessoa  = records[0].get('ORDENS_ID_PESSOAS');
                const mesmaPessoa = records.every(record => {
                    return record.get('ORDENS_ID_PESSOAS') == primeiraPessoa;
                });

                if(!mesmaPessoa){
                    selectionModel.deselectAll();
                    Ext.Note('warning', 'Selecione apenas ordens da mesma pessoa');
                    return;
                }
            }

            if(permitirApenasDeUmaEmpresa) {
                const primeiraEmpresa = records[0].get('ORDENS_ID_EMPRESAS');
                const mesmaEmpresa = records.every(record => {
                    return record.get('ORDENS_ID_EMPRESAS') == primeiraEmpresa;
                });
                
                if(!mesmaEmpresa){
                    selectionModel.deselectAll();
                    Ext.Note('warning', 'Selecione apenas ordens da mesma empresa');
                    return;
                }
            }

            const jaExportados = records.every(record => {
                return record.get('ORDENS_NUMEROORIGEM') > 0;
            });

            if(jaExportados) {
                Ext.Note('warning', 'Este documento já foi importado anteriormente');
            }
        }
    },

    finalizarSelecao: function (record) {
        const vm = this.getViewModel();
        const registrosDaPagina = this.getView().down('grid').getSelectionModel().getSelection();
        const registrosOutrasPaginas = vm.get('registrosOutrasPaginas');
        const registrosSelecionados = record ? [record] : registrosDaPagina.concat(registrosOutrasPaginas);
        const permitirApenasDeUmaEmpresa = vm.get('permitirApenasDeUmaEmpresa');
        
        if(!registrosSelecionados[0]) {
            Ext.Note('warning', 'Selecione pelo menos um item');
            return;
        }
        
        const empresaSelecionada = registrosSelecionados[0].get('ORDENS_ID_EMPRESAS');
        
        const todosMesmaEmpresa = registrosSelecionados.every(record => {
            return record.get('ORDENS_ID_EMPRESAS') == empresaSelecionada;
        });

        const todosComServicos = registrosSelecionados.every(record => {
            return cents(record.get('ORDENS_SERVICOS')) > 0;
        });

        if(!todosComServicos){
            Ext.Note('warning', 'Selecione apenas ordens com serviços');
            return;
        }


        if(!todosMesmaEmpresa && permitirApenasDeUmaEmpresa) {
            Ext.Note('warning', 'Selecione apenas ordens da mesma empresa');
        } else {
            this.getView().initGauge();
            this.executeCallback(null, registrosSelecionados);
            Ext.defer(this.onSairClick, 100, this);
        }
    }
});
