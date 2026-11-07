Ext.define('SamosAdmin.movimentos.movimento.searchitens.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'movimentositenssearch',

    modelName: 'SamosAdmin.movimentos.movimento.searchitens.Model',    

    requires: [
        'SamosAdmin.movimentos.movimento.searchitens.ViewModel',
        'SamosAdmin.movimentos.movimento.searchitens.ViewController',
        'Ext.ux.CheckColumn'
    ],

    title: 'Pedido Itens',

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    width: 920, 
    hidePaging: true, 
    checkSelection: true,

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
            text: 'Descrição',
            dataIndex: 'PRODUTOS_NOME',
            align: 'left'
        },
        {
            flex: false,
            width: 150,
            text: 'Quantidade',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
            align: 'right'
        },
        {
            flex: false,
            width: 100,
            text: 'Loja',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOSITENS_ENTREGUE',
            align: 'right'
        },        
        {
            flex: false,
            width: 100,
            text: 'Entregar',
            xtype: 'moneycolumn',
            dataIndex: 'ITENS_ENTREGAR',
            align: 'right'
        }
    ]
});
