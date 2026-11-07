Ext.define('SamosAdmin.emissao.etiquetasprodutos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.emissaoetiquetas',

    onNovoClick: async function () {
        const form = await this.callParent(arguments);
        await SamosUtils.Utils.sleep(300);
        form.getController().setTabelaTipo(form.model);
        return form;
    },

    getServerUrl: function() {
        return 'server/etiquetas';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo   : vm.get('valueConteudo'),
            tabela     : 'PRODUTOS',
            empresa    : configs.getEmpresa().id,
            empresacnpj: configs.getEmpresa().cnpj,
            status     : vm.get('valueStatus'),
            ordem      : vm.get('valueOrdem'),
            inicio     : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final      : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            view.initGauge();
    
            const queryEtiquetaCompleta = await SamosUtils.Request.nodeApi({
                url: `/etiquetas/${record.get('ETIQUETAS_ID')}`,
                method: 'GET'
            });
            
            if(queryEtiquetaCompleta) {
                record.set(queryEtiquetaCompleta.results[0])
                await this.createForm(record, true, view);
                await SamosUtils.Utils.sleep(1000);
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível carregar a etiqueta');
        }
        
        view.stopGauge();
    }
});
