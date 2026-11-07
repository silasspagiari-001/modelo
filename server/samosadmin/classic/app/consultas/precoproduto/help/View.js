Ext.define('SamosAdmin.consultas.precoproduto.help.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'gridajudas',

    title: 'Atalhos para Pesquisa',
    hidePaging: true,
    height: 380,

    requires: [
        'SamosAdmin.consultas.precoproduto.help.ViewModel',
        'SamosAdmin.consultas.precoproduto.help.ViewController'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            this.focus();    
        }
    },

    constructor: function () {
        Ext.apply(this, {
            columns: {
                items: [
                    {
                        text: 'Coringa',
                        dataIndex: 'CORINGA',
                        flex: false,
                        width: 80,
                        align: 'center'
                    },
                    {
                        text: 'Descrição',
                        dataIndex: 'DESCRICAO',
                        flex: 1
                    },
                    {
                        text: 'Exemplo',
                        dataIndex: 'EXEMPLO',
                        flex: 1
                    }
                ]
            }
        });

        this.callParent(arguments);
    }
});
