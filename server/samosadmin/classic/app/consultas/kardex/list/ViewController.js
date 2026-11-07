Ext.define('SamosAdmin.consultas.kardex.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.kardex',

    onBuscarClick: async function(btn, e) {
        const grid = this.getView().down('grid');
        const txtProduto = this.lookup('produto');
        const vm = this.getViewModel();
        let orcamento = 0;
        let pendente = 0;
        let disponivel = 0;

        if(this.getViewModel().get('valueCodigo')) {
            const records = await this.callParent(arguments);            
            const saldo = records[records.length - 1].data['MOVIMENTOSITENS_SALDO'];
            if(configs.getClientName() == 'racaforte') {
                orcamento = await this.getOrcamentos(this.getViewModel().get('valueCodigo'));
                pendente = await this.getPendencias(this.getViewModel().get('valueCodigo'));
                disponivel = (grams(saldo) - grams(orcamento) - grams(pendente)) / 1000;    
            } else {
                orcamento = 0;
                pendente = 0;
                disponivel = saldo;
            }
            setTimeout(() => {
                vm.set({
                    valueSaldo: saldo,
                    valuePendencia: pendente,
                    valueOrcamento: orcamento,
                    valueDisponivel: disponivel
                });

            }, 100)
            setTimeout(() => {
                grid.getView().scrollTo(0, 1000000, 1000);
                Ext.defer(() => grid.getView().focusRow(records[records.length - 1]), 100);
            }, 100)
        } else {
            Ext.Note('warning', 'Selecione o produto');
            Ext.defer(txtProduto.focus, 100, txtProduto, [true]);
        }
    },

    getServerUrl: function() {
        return 'server/consultas/kardex';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa : configs.getEmpresa().id,
            produto : vm.get('valueCodigo'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final   : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
    },

    getPendencias: async function (produto) {

        const view = this.getView();
        let qtdPendencias = 0;
        
        try {
            qtdPendencias = await SamosUtils.Request.nodeApi({
                url: `/consultas/getpendenciasproduto`,
                method: 'GET',
                query: {
                    produto: produto
                }
            });
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao consultar pendências do produto');
        }
        
        view.stopGauge();

        return qtdPendencias;
    },

    getOrcamentos: async function (produto) {

        const view = this.getView();
        let qtdOrcamentos = 0;
        
        try {
            qtdOrcamentos = await SamosUtils.Request.nodeApi({
                url: `/consultas/getorcamentosproduto`,
                method: 'GET',
                query: {
                    produto: produto
                }
            });
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao consultar orçamentos do produto');
        }
        
        view.stopGauge();

        return qtdOrcamentos;
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
            'listName':      record.get('DOCUMENTOS_NOME'),
            'isConsultaKardex': true, 
        });

        tabpanel.setActiveTab(newForm);

        return newForm;
    }
});
