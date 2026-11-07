Ext.define('SamosAdmin.movimentos.cupomeletronico.form.recuperacao.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formcupomeletronicorecuperacao', 

    requires: [
        'SamosAdmin.movimentos.cupomeletronico.form.recuperacao.ViewModel',
        'SamosAdmin.movimentos.cupomeletronico.form.recuperacao.ViewController'
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
            width: 100,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOS_EMISSAO',
            align: 'center'
        },
        {
            width: 112,
            text: 'Total',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOS_TOTAL',
            align: 'right'
        }
    ]
});
