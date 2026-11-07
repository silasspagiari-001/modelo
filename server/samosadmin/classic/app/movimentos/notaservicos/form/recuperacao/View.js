Ext.define('SamosAdmin.movimentos.notaservicos.form.recuperacao.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formnotaservicosrecuperacao', 

    requires: [
        'SamosAdmin.movimentos.notaservicos.form.recuperacao.ViewModel',
        'SamosAdmin.movimentos.notaservicos.form.recuperacao.ViewController'
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
            dataIndex: 'ORDENS_NOME'
        },
        {
            width: 100,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'ORDENS_EMISSAO',
            align: 'center'
        },
        {
            width: 112,
            text: 'Total',
            xtype: 'moneycolumn',
            dataIndex: 'ORDENS_TOTAL',
            align: 'right'
        }
    ]
});
