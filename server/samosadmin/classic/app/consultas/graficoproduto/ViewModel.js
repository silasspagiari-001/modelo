Ext.define('SamosAdmin.consultas.graficoproduto.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.graficoproduto',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueProduto: '',
            valueEmpresa: configs.getEmpresa().id,
            valueOpcoes : false,
            valueAno    : momentServer().year()
        });

        this.setStores({
            empresas: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.empresas.Model',
                autoLoad: true,
                proxy: {
                    url: 'server/empresas',
                    extraParams: {
                        conteudo: '',
                        ordem: '4',
                        status: '2'
                    }
                }
            }
        })
    }
}); 
