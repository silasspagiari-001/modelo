Ext.define('SamosAdmin.movimentos.romaneiosindustria.form.itens.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosindustriaitens',

    requires: [
        'SamosAdmin.movimentos.romaneiosindustria.form.itens.ViewModel',
        'SamosAdmin.movimentos.romaneiosindustria.form.itens.ViewController'
    ],

    title: 'Produtos Montados',
    height: 400,

    modelName: 'Ext.data.Model',
    hidePaging: true,

    rightbuttons: [
        'Sair'
    ],

    columns: [
        {
            flex: false,
            width: 80,
            text: 'Produto',
            dataIndex: 'MOVIMENTOSITENS_ID_PRODUTOS',
            align: 'center'
            
        },
        {
            flex: 1,
            text: 'Nome do Produto',
            dataIndex: 'PRODUTOS_NOME'
            
        },
        {
            flex: false,
            width: 100,
            text: 'Cor',
            dataIndex: 'PRODUTOS_MARCA'
        },
        {
            flex: false,
            width: 58,
            text: 'Qtde',
            dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
            align: 'center'
        },
        {
            flex: false,
            width: 58,
            text: 'Res',
            dataIndex: 'EMPRESAS_SIGLA',
            align: 'center'
        }        
    ]
});
