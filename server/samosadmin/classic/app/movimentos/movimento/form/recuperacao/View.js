Ext.define('SamosAdmin.movimentos.movimento.form.recuperacao.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosrecuperacao', 

    requires: [
        'SamosAdmin.movimentos.movimento.form.recuperacao.ViewModel',
        'SamosAdmin.movimentos.movimento.form.recuperacao.ViewController'
    ],

    modelName: 'SamosFinanceiros.titulos.Model',

    title: 'Recuperação',
    width: 690,
    height: 459,
    flexForm: 0.6,

    leftbuttons: [
        'Recuperar',
        'Excluir',
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,
    checkSelection: true,

    gridListeners: {
        'selectionchange': 'onSelectionChange'
    }, 

    columns: [
        {
            flex: 1,
            text: 'Nome',
            dataIndex: 'MOVIMENTOS_NOME'
        },
        {
            flex: false,
            width: 100,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOS_EMISSAO',
            align: 'center'
        },
        {
            flex: false,
            width: 112,
            text: 'Total',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOS_TOTAL',
            align: 'right'
        }
    ]
});
