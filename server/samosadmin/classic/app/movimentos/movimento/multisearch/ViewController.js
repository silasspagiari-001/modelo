Ext.define('SamosAdmin.movimentos.movimento.multisearch.ViewController', {
    extend: 'SamosWidgets.multisearch.ViewController',
    alias: 'controller.movimentosmultisearch',

    onImportarClick: function(btn, e) {
        this.finalizarSelecao();
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;

        return {
            empresa        : vm.get('multiEmpresa') == undefined ? (configs.getMultiEmpresa() ? '' : configs.getEmpresa().id) : (vm.get('multiEmpresa') ? '' : configs.getEmpresa().id),
            documento      : '', //trazer pelo nome
            nomedocumento  : title == 'Transferências' ? 'Transferências Saída' : title,
            numero         : vm.get('valueNumero'),
            pessoa         : vm.get('valueIdPessoa'),
            movimentosnome : vm.get('valuePessoa'),
            inicio         : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
            final          : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
            ordem          : vm.get('valueOrdem'),
            status         : vm.get('valueStatus'),
            limit          : configs.getClientName() == 'herbiquimica' ? 999 : 50,
            situacao       : null
        };
    },

    onBeforeItemClick: Ext.emptyFn,

    onSelectionChange: function (selectionModel, records) {
        const permitirApenasDeUmaPessoa = this.getViewModel().get('permitirApenasDeUmaPessoa');
        const permitirApenasDeUmaEmpresa = this.getViewModel().get('permitirApenasDeUmaEmpresa');
        const importaParaNota = this.getView().viewOrigin.getViewModel().get('isNotaEletronica');
        const vendaConsumidor = records.filter(record => record.get('MOVIMENTOS_ID_PESSOAS') == record.get('DOCUMENTOS_ID_PESSOAS'))
        const romaneiomoveis  = this.getView().viewOrigin.title == 'Romaneio' && configs.getMovimentos().ramoRomaneio == 'moveis';
        const montagem = this.getView().viewOrigin.listName.match(/Montagem/) && configs.getMovimentos().ramoRomaneio == 'moveis';
        
        // Soma dos selecionados
        const totalSelecionado = records.reduce((result, movimento) => {
            return result + cents(movimento.get('MOVIMENTOS_TOTAL'));
        }, 0) / 100;

        this.getViewModel().set('totalSelecionado', Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(totalSelecionado));
        // Fim da Soma

        if(importaParaNota && vendaConsumidor.length) {
            selectionModel.deselect(vendaConsumidor);
            Ext.Note('warning', '<b>Venda Consumidor:</b><br><br>Faça o cadastro do cliente antes de importar esse(s) movimento(s)');
            
        } else if(records[0]){
            if(permitirApenasDeUmaPessoa) {
                const primeiraPessoa  = records[0].get('MOVIMENTOS_ID_PESSOAS');
                const mesmaPessoa = records.every(record => {
                    return record.get('MOVIMENTOS_ID_PESSOAS') == primeiraPessoa;
                });

                if(!mesmaPessoa){
                    selectionModel.deselectAll();
                    Ext.Note('warning', 'Selecione apenas movimentos da mesma pessoa');
                    return;
                }
            }

            if(permitirApenasDeUmaEmpresa) {
                const primeiraEmpresa = records[0].get('MOVIMENTOS_ID_EMPRESAS');
                const mesmaEmpresa = records.every(record => {
                    return record.get('MOVIMENTOS_ID_EMPRESAS') == primeiraEmpresa;
                });
                
                if(!mesmaEmpresa){
                    selectionModel.deselectAll();
                    Ext.Note('warning', 'Selecione apenas movimentos da mesma empresa');                
                    return;
                }
            }

            const jaExportados = records.every(record => {
                return record.get('MOVIMENTOS_NUMEROORIGEM') > 0;
            });

            if(romaneiomoveis) {
                const local = this.getView().viewOrigin.getController().getRecord().get('ROMANEIOS_LOCAL');
                const urbanos    = records.filter(record => record.get('EMPRESAS_ID_CIDADES') == record.get('PESSOAS_ID_CIDADES'));
                const suburbanos = records.filter(record => record.get('EMPRESAS_ID_CIDADES') != record.get('PESSOAS_ID_CIDADES'));
                const semReservas = records.filter(record => record.get('RESERVAS_STATUS') == 'F');
                const grid = this.getView().down('grid');
                const hoje = momentServer().hours(0).minutes(0).seconds(0);
                const limiteDias = configs.getMovimentos().limiteDiasPedidoRomaneio || 99999;
                let aviso = false;

                const vencidos = records.filter(record => {
                    const emissao = momentTz(record.get('MOVIMENTOS_EMISSAO')).hours(0).minutes(0).seconds(0);
                    const tempoPedidoEmDias = (hoje - emissao) / 1000 / 60 / 60 / 24;
                    return tempoPedidoEmDias > limiteDias;
                });

                grid.suspendEvent('selectionchange');

                if(!montagem){
                    if(local == 'U' && suburbanos.length > 0) {
                        selectionModel.deselect(suburbanos);
                        Ext.Note('warning', 'Apenas pedidos urbanos');
                        aviso = true;
                    } else if(local == 'S' && urbanos.length > 0) {
                        selectionModel.deselect(urbanos);
                        Ext.Note('warning', 'Apenas pedidos suburbanos');
                        aviso = true;
                    }
                }

                if(semReservas.length > 0) {
                    selectionModel.deselect(semReservas);
                    setTimeout(() => {
                        if(!aviso) { Ext.Note('warning', 'Apenas pedidos com reserva'); }
                    }, 100);
                }

                if(vencidos.length > 0){
                    if(aviso){
                        selectionModel.deselect(vencidos);
                        setTimeout(() => {
                            grid.resumeEvent('selectionchange');
                        }, 1);
                    } else if(!configs.getUsuario().privilegiado){
                        Ext.Note('warning', 'Apenas pedidos com menos de ' + limiteDias + ' dias');
                        
                        const nivel = 1;
            
                        Ext.create({ xtype: 'samoswidgets-senhanivel' })
                            .iniciar(nivel)
                            .then(() => {
                                setTimeout(() => {
                                    grid.resumeEvent('selectionchange');
                                }, 1);
                            })
                            .catch(() => {
                                selectionModel.deselect(vencidos);
                                setTimeout(() => {
                                    grid.resumeEvent('selectionchange');
                                }, 1);
                            });
                    }
                } else {
                    setTimeout(() => {
                        grid.resumeEvent('selectionchange');
                    }, 1);
                }
            } else if(jaExportados) {
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
        
        const empresaSelecionada = registrosSelecionados[0].get('MOVIMENTOS_ID_EMPRESAS');
        
        const todosMesmaEmpresa = registrosSelecionados.every(record => {
            return record.get('MOVIMENTOS_ID_EMPRESAS') == empresaSelecionada;
        });

        if(!todosMesmaEmpresa && permitirApenasDeUmaEmpresa) {
            Ext.Note('warning', 'Selecione apenas movimentos da mesma empresa');
        } else {
            this.getView().initGauge();
            this.executeCallback(null, registrosSelecionados);
            Ext.defer(this.onSairClick, 100, this);
        }
    }
});
