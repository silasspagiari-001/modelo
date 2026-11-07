Ext.define('SamosAdmin.atualizacao.propriedades.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'propriedadessearch',

    requires: [
        'SamosAdmin.atualizacao.propriedades.search.ViewModel',
        'SamosAdmin.atualizacao.propriedades.search.ViewController'
    ],

    modelName:  'SamosAdmin.atualizacao.pessoas.form.propriedades.Model',
    hidePaging: true,
    checkSelection: false, 
    height: 380,

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('PROPRIEDADES_STATUS') == 'F') {
                return "inativo";
            }
        }
    },


    columns: [
        {
            flex: false,
            width: 80,
            align: 'center',
            text: 'Código',
            dataIndex: 'PROPRIEDADES_ID'
        },
        {
            flex: false,
            width: 150,
            text: 'Inscrição',
            dataIndex: 'PROPRIEDADES_INSCRICAO'
        },
        {
            flex: 2,
            text: 'Endereço',
            dataIndex: 'ENDERECO_COMPLETO'
        },
        {
            flex: 2,
            text: 'Município/UF',
            dataIndex: 'CIDADE_COMPLETA'
        }
    ]
});
