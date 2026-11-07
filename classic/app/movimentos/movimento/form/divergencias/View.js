Ext.define('SamosAdmin.movimentos.movimento.form.divergencias.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosdivergencias', 

    requires: [
        'SamosAdmin.movimentos.movimento.form.divergencias.ViewModel',
        'SamosAdmin.movimentos.movimento.form.divergencias.ViewController'
    ],

    modelName: 'SamosAdmin.movimentos.movimento.form.divergencias.Model',

    title: 'Divergências',

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true, 

    columns: [
        {
            flex: 1,
            text: 'Descrição',
            dataIndex: 'DESCRICAO',
            align: 'left'
        },
        {
            flex: false,
            width: 150,
            text: 'Informado',
            xtype: 'moneycolumn',
            dataIndex: 'INFORMADO',
            align: 'right',
            renderer: function(value, meta, record, rowIndex, colIndex, store, view) {
                return Ext.util.Format.maskRenderer('#9.990,00', true, false, true)(value);
            }
        },        
        {
            flex: false,
            width: 150,
            text: 'Calculado',
            xtype: 'moneycolumn',
            dataIndex: 'CALCULADO',
            align: 'right',
            renderer: function(value, meta, record, rowIndex, colIndex, store, view) {
                return Ext.util.Format.maskRenderer('#9.990,00', true, false, true)(value);
            }
        }
    ]
});
