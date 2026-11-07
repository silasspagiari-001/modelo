Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.cartas.list.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentossefazcartas',

    requires: [
        'SamosAdmin.movimentos.movimento.form.sefaz.cartas.list.ViewModel',
        'SamosAdmin.movimentos.movimento.form.sefaz.cartas.list.ViewController'
    ],
    
    width: 810,
    height: 485,

    title: 'Cartas de Correção',
    modelName: 'SamosAdmin.movimentos.movimento.form.sefaz.cartas.Model',
    hidePaging: true,

    listeners: {
        afterrender: 'loadCartas'
    },

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('MOVIMENTOSCARTAS_STATUS');

            if (status == 'T') {
                return "preto";
            } else if (status == 'F') {
                return "vermelho";
            } 
        }
    },

    columns: [
        {
            flex: false,
            width: 120,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOSCARTAS_EMISSAO',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Descrição',
            dataIndex: 'MOVIMENTOSCARTAS_NOME'
        },
        {
            flex: false,
            width: 200,
            text: 'Protocolo',
            dataIndex: 'MOVIMENTOSCARTAS_PROTOCOLO'
        }
    ]
});
