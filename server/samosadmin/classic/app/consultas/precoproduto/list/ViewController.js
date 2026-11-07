Ext.define('SamosAdmin.consultas.precoproduto.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.precoproduto',

    onKeyDownCamposToolbar: function (txt, event) {
        if(SamosUtils.Events.isF2(event)) {
            const view = Ext.create({ 
                xtype: 'gridajudas'
            });    
            this.getView().add(view);
        } else {
            this.callParent(arguments);
        }
    },

    onEnviarParaLousaClick: async function () {

        const grid = this.getView().down('grid');
        const selectionModel = grid.getSelectionModel();
        const produtos = selectionModel.getSelection();

        if (!produtos.length) {
            Ext.Note('warning', 'Selecione ao menos um produto');
            return;
        }

        try {
            const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');

            if (!tabpanel) {
                throw 'Não foi possível localizar o painel de abas.';
            }

            let lousa = tabpanel.down('lousa');
            const lousaNova = !lousa;

            if (lousaNova) {
                lousa = Ext.create({
                    xtype: 'lousa',
                    title: 'Lousa'
                });

                tabpanel.add(lousa);
            }

            tabpanel.setActiveTab(lousa);

            // IMPORTANTE: quando a Lousa é criada, o initViewModel ainda
            // prepara o model e executa cleanChilds(). Por isso a inclusão
            // precisa ocorrer somente depois que a tela terminou de abrir.
            const enviar = function () {
                const controller = lousa.getController();

                if (!controller) {
                    Ext.Note('error', 'Controller da Lousa não encontrado');
                    return;
                }

                const resultado = controller.adicionarProdutos(produtos) || {
                    incluidos: 0,
                    duplicados: []
                };

                // Após processar o envio, limpa a seleção da Consulta de Preços.
                // Isso vale também para produtos ignorados por já existirem na Lousa.
                selectionModel.deselectAll();

                if (resultado.incluidos > 0) {
                    Ext.Note(
                        'success',
                        resultado.incluidos + (resultado.incluidos === 1
                            ? ' produto enviado para a Lousa'
                            : ' produtos enviados para a Lousa')
                    );
                }

                if (resultado.duplicados.length > 0) {
                    Ext.Msg.alert(
                        'Produto já existente na Lousa',
                        'O' + (resultado.duplicados.length > 1 ? 's produtos abaixo já estão' : ' produto abaixo já está') +
                        ' na Lousa e não ' + (resultado.duplicados.length > 1 ? 'foram transferidos' : 'foi transferido') +
                        ' novamente:<br><br><b>' +
                        Ext.Array.map(resultado.duplicados, function (nome) {
                            return Ext.String.htmlEncode(String(nome));
                        }).join('<br>') +
                        '</b>'
                    );
                }
            };

            if (lousaNova) {
                Ext.defer(enviar, 600);
            } else {
                enviar();
            }

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar produtos para a Lousa');
        }

    },

    onItemDblClick: async function(grid, rowIndex, colIndex) {
        const record = rowIndex.get ? rowIndex : grid.getStore().getAt(rowIndex);

        await this.createForm(record, false, this.getView());
    },

    createForm: async function (record, readOnly, listView) {

        const isProdutoLote = !record.get('DERIVADO').match(/T|F/);

        if(isProdutoLote) {

            const janelaLotes = Ext.create({
                xtype: 'formprecoslotes',
                modelName: this.getView().modelName,
                className: this.getView().xtype,
                listView: listView
            });
    
            const produto = Ext.create('SamosAdmin.atualizacao.produtos.Model', Object.assign({}, record.data));
        
            janelaLotes.getViewModel().set({
                model: produto
            });
    
            return janelaLotes;    

        } else {  // Janela normal - produtos sem lote
            const janelaSaldos = Ext.create({
                xtype: 'formprecossaldos',
                modelName: this.getView().modelName,
                className: this.getView().xtype,
                listView: listView
            });
    
            const produto = Ext.create('SamosAdmin.atualizacao.produtos.Model', Object.assign({}, record.data));
    
            if(
                !configs.getUsuario().privilegiado &&
                configs.getProdutos().exibirSaldoApenasLocalEDeposito
            ) {//so ve da propria empresa e do deposito, com saldo maximo 10
                produto.data['SALDOS'] = (produto.data['SALDOS'] || []).filter(saldo => {
                    if(
                        (saldo['EMPRESAS_ID'] == configs.getEmpresa().id) || 
                        (saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i)
                    ) {
                        if((saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i)){
                            saldo['SALDOS_DISPONIVEL'] = saldo['SALDOS_DISPONIVEL'] > 10 ? 10 : saldo['SALDOS_DISPONIVEL'];
                        }
                        return true;
                    } else {
                        return false;
                    };
                });
            }
    
            janelaSaldos.getViewModel().set({
                model: produto
            });
    
            return janelaSaldos;    
        }
    },

    getServerUrl: function() {
        return 'server/consultas/precoproduto';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            ordem: vm.get('valueOrdem'),
            conteudo: vm.get('valueConteudo'),
            grupoinicial: vm.get('valueGrupo'),
            grupofinal: vm.get('valueAte'),
            status: configs.getClientName() == 'stilomoveis' ? vm.get('valueStatus') : configs.getProdutos().statusConsultaPreco, // 0 - Ativos, 1 - Inativos, 2 - Fora de Linha, 3 - Todos produtos
            tipopreco: configs.getMovimentos().tipoPreco
        };
    }
});
