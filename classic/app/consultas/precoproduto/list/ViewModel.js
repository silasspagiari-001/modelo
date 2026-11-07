Ext.define('SamosAdmin.consultas.precoproduto.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.precoproduto',
    
    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: configs.getProdutos().ordemBusca,
            valueStatus: 'T'
        });

        this.setFormulas({
            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },
            isPrudenmoveis: function(get) {
                return configs.getClientName() == 'prudenmoveis';
            },
            isStilomoveis: function(get) {
                return configs.getClientName() == 'stilomoveis';
            },

            hideEnviarParaLousa: function(get) {

                const acessoLousa = Permissao.services.Model.podeLer({groupName: 'Consultas',  moduleName: 'Lousa' });

                return configs.getClientName() != 'stilomoveis' ||
                       !acessoLousa;
            },

        });            

    }
});  
 