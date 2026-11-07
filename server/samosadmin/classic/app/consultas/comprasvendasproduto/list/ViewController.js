Ext.define('SamosAdmin.consultas.comprasvendasproduto.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.comprasvendasproduto',

    onBuscarClick: function(btn, e) {
        const txtProduto = this.lookup('produto');
        const txtInicio = this.lookup('inicio');
        const txtFinal = this.lookup('final');

        if(!this.getViewModel().get('valueIdProduto')) {
            Ext.Note('warning', 'Selecione o produto');
            Ext.defer(txtProduto.focus, 100, txtProduto, [true]);
        } else if(!this.getViewModel().get('valueInicio')) {
            Ext.Note('warning', 'Selecione a data');
            Ext.defer(txtInicio.focus, 100, txtInicio, [true]);
        } else if(!this.getViewModel().get('valueFinal')) {
            Ext.Note('warning', 'Selecione a data');
            Ext.defer(txtFinal.focus, 100, txtFinal, [true]);
        } else {
            this.callParent(arguments);
        }
    },

    getServerUrl: function() {
        return 'server/consultas/comprasvendasproduto'; 
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            pessoa : vm.get('valueIdPessoa'),
            produto: vm.get('valueIdProduto'),
            acao   : this.getView().title.match(/Venda/) ? 'VN' : 'CN',
            inicio : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final  : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
    },

    onImprimirClick: async function () {

        const view = this.getView();
        const vm = this.getViewModel();       

        try {

            const txtProduto = this.lookup('produto');
            const txtInicio = this.lookup('inicio');
            const txtFinal = this.lookup('final');
    
            if(!this.getViewModel().get('valueIdProduto')) {
                Ext.Note('warning', 'Selecione o produto');
                Ext.defer(txtProduto.focus, 100, txtProduto, [true]);
                return;
            } else if(!this.getViewModel().get('valueInicio')) {
                Ext.Note('warning', 'Selecione a data');
                Ext.defer(txtInicio.focus, 100, txtInicio, [true]);
                return;                
            } else if(!this.getViewModel().get('valueFinal')) {
                Ext.Note('warning', 'Selecione a data');
                Ext.defer(txtFinal.focus, 100, txtFinal, [true]);
                return;                
            }    
    
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/comprasvendasproduto`,
                method: 'GET',
                query: {
                    empresa: configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
                    pessoa : vm.get('valueIdPessoa'),
                    produto: vm.get('valueIdProduto'),
                    acao   : this.getView().title.match(/Venda/) ? 'VN' : 'CN',
                    inicio : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                    final  : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD')
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

    afterLoadMainStore: function(store, records, success, operation) {
        const lastModel = records[records.length -1];
        const totalGeral = lastModel ? lastModel.get('MOVIMENTOSITENS_TOTALGERAL') : 0;
        const totalFormatado = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(totalGeral);

        this.getViewModel().set('totalGeral', totalFormatado);
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
            permissoes: {
                lockNovo:    true,
                lockAlterar: true,
                lockExcluir: true
            },
            model: record
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

        return newForm;
    }
});
