Ext.define('SamosAdmin.consultas.comprasvendaspessoa.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.comprasvendaspessoa',

    onBuscarClick: function(btn, e) {
        const vm = this.getViewModel();

        try {
            const txtPessoa = this.lookup('pessoa');
            const txtInicio = this.lookup('inicio');
            const txtFinal = this.lookup('final');
    
            if(!vm.get('valueIdPessoa')) {
                Ext.defer(txtPessoa.focus, 100, txtPessoa, [true]);
                throw 'Selecione a pessoa';
            }
            
            if(!vm.get('valueInicio')) {
                Ext.defer(txtInicio.focus, 100, txtInicio, [true]);
                throw 'Selecione a data';
            }
            
            if(!vm.get('valueFinal')) {
                Ext.defer(txtFinal.focus, 100, txtFinal, [true]);
                throw 'Selecione a data';
            }
            
            this.callParent(arguments);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Não foi possível buscar')
        }
    },

    getServerUrl: function() {
        return 'server/consultas/comprasvendaspessoa';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            pessoa : vm.get('valueIdPessoa'),
            produto: vm.get('valueIdProduto'),
            acao   : this.getView().title.match(/Venda/) ? 'VN' : 'CN',
            inicio : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final  : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
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
