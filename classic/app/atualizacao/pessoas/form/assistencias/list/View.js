Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.list.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'assistencias',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.assistencias.list.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.assistencias.list.ViewController'
    ],

    modelName:  'SamosAdmin.atualizacao.pessoas.form.assistencias.Model',
    hidePaging: true,
    checkSelection: false, 

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('ORDENS_STATUS') == 'F') {
                return "inativo";
            }
        }
    },

    constructor: function() {        
        Ext.apply(this, {
            columns: [
                {
                    flex: false,
                    align: 'center',
                    width: 90,
                    text: 'Número',
                    dataIndex: 'ORDENS_NUMERO'
                },
                {
                    flex: false,
                    width: 100,
                    text: 'Data',
                    xtype: 'datecolumn',
                    dataIndex: 'ORDENS_EMISSAO'
                },
                {
                    flex: 2,
                    text: 'Descrição',
                    dataIndex: 'ORDENS_REFERENCIA'
                }
            ]
        });

        this.callParent(arguments);
    }
});
