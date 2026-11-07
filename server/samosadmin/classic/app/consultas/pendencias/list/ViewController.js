Ext.define('SamosAdmin.consultas.pendencias.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.pendencias',

    getServerUrl: function() {
        return 'server/consultas/pendencias';
    },

    onBuscarClick: function(btn, e) {
        const vm = this.getViewModel();

        try {
            const txtPessoa = this.lookup('pessoa');
    
            if(!vm.get('valueIdPessoa')) {
                Ext.defer(txtPessoa.focus, 100, txtPessoa, [true]);
                throw 'Selecione a pessoa';
            }            
            this.callParent(arguments);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Não foi possível buscar')
        }
    },

    onImprimirClick: async function () {

        const view = this.getView();
        const vm = this.getViewModel();

        try {

            const idPessoa = vm.get('valueIdPessoa') || 0;
    
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/pendencias`,
                method: 'GET',
                query: {
                    pessoa : idPessoa
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
    },

    onGerarPedidoClick: async function(btn, e) {

        Ext.Msg.confirm('Confirmação', 'Confirma a geração do pedido com itens selecionados?', btn => {
            if (btn == 'yes') {
                this.gerarPedido();
            }
        });


    },

    gerarPedido: async function() {  
        
        const view = this.getView();
        
        view.initGauge('Gerando pedido...');
        
        const selecionados = view.down('grid').getSelectionModel().getSelection();

        let itensPedido = [];

        selecionados.forEach(item => {
            itensPedido.push(item.data);
        })

        if(itensPedido.length == 0) {
            Ext.Note('warning', 'Não há itens a exportar');
            view.stopGauge();
            return;
        }
        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
        let listPedido = Ext.$('movimentos')[0];
        const pedido = Ext.create('SamosAdmin.movimentos.movimento.Model');
        
        if(!listPedido) {
            const permissoes = Permissao.services.Model.get({
                groupName: 'Movimentos',
                moduleName: 'Orçamentos'
            });

            listPedido = tabpanel.add({
                xtype: 'movimentos',
                title: 'Orçamento',
                permissoes: {
                    lockNovo:    permissoes.create  === false || permissoes.create  === 'F',
                    lockAlterar: permissoes.update  === false || permissoes.update  === 'F',
                    lockExcluir: permissoes.destroy === false || permissoes.destroy === 'F'
                }
            });
        }

        let itensGravar = [];
        
        let totalProdutos  = 0;
        let totalDescontos = 0;
        let totalPedido    = 0

        for(let i in itensPedido) {
            const dataItem = {
                'MOVIMENTOSITENS_ID_PRODUTOS':   itensPedido[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                'PRODUTOS_NOME':                 itensPedido[i]['PRODUTOS_NOME'],
                'MOVIMENTOSITENS_QUANTIDADE':    itensPedido[i]['MOVIMENTOSITENS_QUANTIDADE'],
                'MOVIMENTOSITENS_PRECO':         itensPedido[i]['MOVIMENTOSITENS_PRECO'],
                'MOVIMENTOSITENS_CUSTO':         itensPedido[i]['MOVIMENTOSITENS_CUSTO'],                
                'MOVIMENTOSITENS_PERCENTUAL':    itensPedido[i]['MOVIMENTOSITENS_PERCENTUAL'],
                'MOVIMENTOSITENS_DESCONTOS':     itensPedido[i]['MOVIMENTOSITENS_DESCONTOS'],
                'VALOR_LIQUIDO':                 itensPedido[i]['VALOR_LIQUIDO'],
                'TOTAL_LIQUIDO':                 itensPedido[i]['TOTAL_LIQUIDO'],
                'MOVIMENTOSITENS_TOTAL':         itensPedido[i]['MOVIMENTOSITENS_TOTAL'],
                'MOVIMENTOSITENS_ID_OPERACOES':  500000,
                'MOVIMENTOSITENS_CST':           itensPedido[i]['MOVIMENTOSITENS_CST'],
                'MOVIMENTOSITENS_ID_EMPRESAS':   itensPedido[i]['MOVIMENTOSITENS_ID'],
                'MOVIMENTOSITENS_HORAENTREGA':   itensPedido[i]['MOVIMENTOS_NUMERO'].toString() + '-' + itensPedido[i]['MOVIMENTOS_SERIE']
            };

            totalProdutos  += cents(itensPedido[i]['MOVIMENTOSITENS_TOTAL']);
            totalDescontos += cents(itensPedido[i]['MOVIMENTOSITENS_DESCONTOS']);
            totalPedido    += cents(itensPedido[i]['TOTAL_LIQUIDO']);
    
            itensGravar.push(dataItem);
        }    

        /* será preciso mudar de lugar somente atualizar apos gravar o pedido
        await SamosUtils.Request.nodeApi({  // Dá baixa nas pendencias
            url: `/processos/atualizacfopitens`,
            method: 'POST',
            data: itensGravar
        });
        */

        pedido.set(pedido.getIdProperty(), 0);

        pedido.set({
            'MOVIMENTOS_ID_EMPRESAS'    : itensPedido[0]['MOVIMENTOS_ID_EMPRESAS'],
            'MOVIMENTOS_ID_DOCUMENTOS'  : itensPedido[0]['MOVIMENTOS_ID_EMPRESAS'].toString() + '0002',
            'MOVIMENTOS_ID_PESSOAS'     : itensPedido[0]['MOVIMENTOS_ID_PESSOAS'],
            'MOVIMENTOS_NOME'           : itensPedido[0]['MOVIMENTOS_NOME'],
            'PESSOAS_ID'                : itensPedido[0]['PESSOAS_ID'],
            'PESSOAS_NOME'              : itensPedido[0]['PESSOAS_NOME'],
            'PESSOAS_ENDERECO'          : itensPedido[0]['PESSOAS_ENDERECO'],
            'CIDADES_NOME'              : itensPedido[0]['CIDADES_NOME'],
            'CIDADES_ESTADO'            : itensPedido[0]['CIDADES_ESTADO'],
            'MOVIMENTOS_ID_USUARIOS'    : configs.getUsuario().id,
            'MOVIMENTOS_ID_OPERACOES'   : 500000,
            'MOVIMENTOS_ID_PRAZOS'      : 130,
            'MOVIMENTOS_ID_APLICACOES'  : 0,
            'MOVIMENTOS_ID_CUSTOS'      : 1,
            'MOVIMENTOS_SERIEORIGEM'    : 'PD',
            'MOVIMENTOS_ID_PROPRIEDADES': 0,
            'MOVIMENTOS_ITENS'          : itensGravar,
            'MOVIMENTOS_PRODUTOS'       : (totalProdutos / 100),
            'MOVIMENTOS_DESCONTOS'      : (totalDescontos / 100),
            'MOVIMENTOS_TOTAL'          : (totalPedido / 100)
        });
        
        const formPedido = Ext.create({
            xtype: 'formmovimentos',
            listName: 'Orçamentos',
            listView: listPedido,
            permissoes: listPedido.getPermissoes(),
            model: pedido
        });
        
        const formPedidoController = formPedido.getController();

        tabpanel.add(formPedido);

        formPedido.getViewModel().set({
            'readOnly':       false,
            'initialValues':  {},
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          pedido,
            'listName':       'Orçamentos'
        });

        tabpanel.setActiveTab(formPedido);
        tabpanel.disableOtherTabs();
        formPedidoController.doDefaultFocus();
        await Movimento.services.Model.definirValoresPadrao(formPedido, 'Pedido');
        formPedido.lookup('pessoa').setSearchedId(pedido.get('MOVIMENTOS_ID_PESSOAS'));

        formPedido.model.set('MOVIMENTOS_ID_DOCUMENTOS', configs.getEmpresa().id.toString() + '0002');
        formPedido.lookupReference('tipodocumento').setReadOnly(true);        

        view.stopGauge();

    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            pessoa : vm.get('valueIdPessoa'),
            produto: vm.get('valueIdProduto')
        };
    },

    afterLoadMainStore: function(store, records, success, operation) {
        this.getViewModel().set('forceTotais', new Date());        
        this.getView().down('grid').getSelectionModel().deselectAll();
                
    },

    onSelectionChange: function (selModel, records) {

        const view                   = this.getView();        
        const pendenciasSelecionadas = view.down('grid').getSelectionModel().getSelection();

        const valorTotalSelecionado = pendenciasSelecionadas.reduce((result, pendencia) => {
            return result + cents(pendencia.get('TOTAL_LIQUIDO'));
        }, 0) / 100;

        const totalMascara = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(valorTotalSelecionado);

        this.getViewModel().set('totalSelecionado', totalMascara);
    },


    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            view.initGauge();

            const idMovimento = record.get('MOVIMENTOSITENS_ID_MOVIMENTOS');

            const queryMovimento = await SamosUtils.Request.nodeApi({
                url: `/movimentos/${idMovimento}`,
                method: 'GET'
            });
            
            const movimento = Ext.create('SamosAdmin.movimentos.movimento.Model', queryMovimento.results[0]);
                
            await this.createForm(movimento, false, view);

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar movimento');
        }

        view.stopGauge();
    },

    createForm: async function (record, readOnly, listView) {
        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
        const newForm = Ext.create({
            xtype: 'formmovimentos',
            title: record.get('DOCUMENTOS_NOME'),
            listName: record.get('DOCUMENTOS_NOME'),
            listView: listView,
            model: record,
            permissoes: {
                lockNovo:    true,
                lockAlterar: true,
                lockExcluir: true
            }
        });

        tabpanel.add(newForm);

        newForm.getViewModel().set({
            'readOnly':      true,
            'initialValues': record.getData(),
            'previousModel': undefined,
            'editionClosed': true,
            'model':         record,
            'listName':      record.get('DOCUMENTOS_NOME')      
        });

        tabpanel.setActiveTab(newForm);
        newForm.applyTextSearches();

        return newForm;
    }
});
