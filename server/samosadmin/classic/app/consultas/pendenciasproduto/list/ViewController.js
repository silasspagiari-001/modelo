Ext.define('SamosAdmin.consultas.pendenciasproduto.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.pendenciasproduto',

    getServerUrl: function() {
        return 'server/consultas/pendenciasproduto';
    },

    onBuscarClick: function(btn, e) {
        const vm = this.getViewModel();

        try {
            const txtProduto = this.lookup('produto');
    
            if(!vm.get('valueIdProduto')) {
                Ext.defer(txtProduto.focus, 100, txtProduto, [true]);
                throw 'Selecione o produto';
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

            const idProduto = vm.get('valueIdProduto') || 0;
    
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/pendenciasproduto`,
                method: 'GET',
                query: {
                    produto : idProduto
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
