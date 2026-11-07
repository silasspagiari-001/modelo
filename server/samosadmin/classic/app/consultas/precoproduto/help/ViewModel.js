Ext.define('SamosAdmin.consultas.precoproduto.help.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.gridajudas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            dadosFixos: [
                {
                    CORINGA: '.',
                    DESCRICAO: 'Pesquisa pelo Código',
                    EXEMPLO: '.1235'
                },
                {
                    CORINGA: '+',
                    DESCRICAO: 'Pesquisa pelo NOME',
                    EXEMPLO: '+Nome'
                },
                {
                    CORINGA: '#',
                    DESCRICAO: 'Pesquisa pelo Código de BARRAS',
                    EXEMPLO: '#7898446730574'
                },
                {
                    CORINGA: '@',
                    DESCRICAO: 'Pesquisa pela MARCA',
                    EXEMPLO: '@Marca Produto'
                },
                {
                    CORINGA: '-',
                    DESCRICAO: 'Pesquisa pelo código do FABRICANTE',
                    EXEMPLO: '-PKX45X-7'
                }
            ]
        });

        this.setFormulas({
            hideSair: function (get) {
                return false;
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                fields: ['CORINGA', 'DESCRICAO', 'EXEMPLO'],
                autoLoad: true,
                data: '{dadosFixos}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});
