Ext.define('SamosAdminModern.orcamentos.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.orcamentos',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true
        });

        const permissoes = JSON.parse(configs.getPermissao()['PERMISSOES_ITENS']);

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Movimentos').children) {
                if(p.text == 'Orçamentos') {
                    main.getViewModel().set({
                        hideNovo: p.create  == 'F'
                    });
                }
            }
        } catch (e) {
            main.getViewModel().set({
                hideNovo: true
            });
        }
    },

    onPesquisarClick: function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            view.initGauge();

            const store = vm.getStore('main');
            
            store.currentPage = 1;

            store.getProxy().setExtraParams({
                numero        : '',
                empresa       : configs.getEmpresa().id,
                pessoa        : '',
                documento     : '', //trazer pelo nome
                nomedocumento : configs.getClientName() == 'herbiquimica' ? 'Pedidos' : 'Orçamentos',
                filtravendedor: (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
                movimentosnome: vm.get('valueConteudo'),
                inicio        : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
                final         : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
                ordem         : vm.get('valueOrdem'),
                status        : vm.get('valueStatus')
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onNovoClick: async function () {
        const main = this.getView().up('main');
        const view = this.getView();

        const novoMovimento = Ext.create('SamosAdminModern.orcamentos.Model');

        try {
            // Na pruden checa sempre se o caixa está aberto, em qualquer movimento
            if(configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) { 
                view.initGauge();
        
                const data = momentServer().format('YYYY-MM-DD');
                const statusCaixa = await Caixa.services.Model.getStatus(data);
        
                view.stopGauge(true);
        
                if(statusCaixa == 'F') {
                    return await SamosUtils.Msg.alert('Atenção', 'O caixa diário está fechado!');
                } else if(!statusCaixa) {
                    return await SamosUtils.Msg.alert('Atenção', 'O caixa diário não foi aberto!');                    
                }
            }

            if(configs.getClientName() != 'racaforte') {                
                view.initGauge();

                const nfPendentes = await Orcamento.services.Documento.verificarNFPendentes({ 
                    meses     : 1,
                    incluiHoje: 'F'
                });
    
                if(nfPendentes) {
                    view.stopGauge();
                    return await SamosUtils.Msg.alert('Lembrete', `Há notas a serem enviadas!<br><h5>${nfPendentes}<h5>`, 4000);
                }
    
                view.stopGauge();    
            }
            
            await Orcamento.services.Model.definirValoresPadrao(novoMovimento, 'Orçamentos');
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível incluir um novo movimento');
        }

        main.down('panel').setActiveItem('orcamentosform');
        main.down('container[reference="title"]').setHtml('Orçamento');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': novoMovimento,
            'readOnly': true,
            'initialValues': Object.assign({}, novoMovimento.data),
            'forceChangeId': new Date()
        });
    
        main.down('panel').getActiveItem().getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : false,
            hideNovo   : true
        });

        main.down('panel').getActiveItem().getViewModel().set('readOnly', false);

        Ext.defer(() => {
            main.down('panel').getActiveItem().query('field')
                .filter(field => !field.getReadOnly())  
                .map(field => {
                    try { field.el.dom.querySelector('input').style.backgroundColor = '#e5e5e5'; } catch (e) { }
                })
        }, 100)
    },

    onItemClick: async function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        try {
            main.initGauge();

            const movimentoCompleto = await Orcamento.services.Model.get(record.get('MOVIMENTOS_ID'));

            if(movimentoCompleto) {
                record.set(movimentoCompleto[0].data);
                main.down('panel').setActiveItem('orcamentosform');
                main.down('container[reference="title"]').setHtml('Orçamento');

                const status = record.get('MOVIMENTOS_STATUS');
                const obs = record.get('MOVIMENTOS_OBSERVACOES');

                record.set('MOVIMENTOS_OBSERVACOES', obs.replace(/\|/ig, '\n'));

                main.getViewModel().set({
                    hideVoltar : false
                })

                const permissoes = JSON.parse(configs.getPermissao()['PERMISSOES_ITENS']);

                try {
                    for (let p of permissoes.children.find(n1 => n1.text == 'Movimentos').children) {  // antes 'Atualização'
                        if(p.text == 'Orçamentos') { // antes 'Usuários'
                            main.getViewModel().set({
                                hideExcluir: p.destroy == 'F' || status != 'N',
                                hideAlterar: p.update  == 'F' || status != 'N',
                                hideGravar : true,
                                hideNovo   : true
                            });
                        }
                    }
                } catch (e) {
                    main.getViewModel().set({
                        hideExcluir: true,
                        hideAlterar: true,
                        hideGravar : true,
                        hideNovo   : true
                    });
                }
        
                main.down('panel').getActiveItem().getViewModel().set({
                    'model': record,
                    'readOnly': true,
                    'initialValues': Object.assign({}, record.data),
                    'forceChangeId': new Date()
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar movimento');
        }
        
        main.stopGauge();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').show();
        main.down('panel').setActiveItem('menulist');
        main.down('container[reference="title"]').setHtml('Menu');
        
        main.getViewModel().set({
            hideVoltar : true,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    }
});
