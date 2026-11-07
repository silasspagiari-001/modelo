Ext.define('SamosAdmin.movimentos.movimento.form.compraspessoa.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentoscompraspessoa', 

    requires: [
        'SamosAdmin.movimentos.movimento.form.compraspessoa.ViewModel',
        'SamosAdmin.movimentos.movimento.form.compraspessoa.ViewController'
    ],

    modelName: 'SamosAdmin.consultas.comprasvendaspessoa.Model',

    title: 'Compras Cliente Produto',
    width: 690,
    height: 459,
    flexForm: 0.6,

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true, 

    columns: [
        {
            flex: false,
            width: 67,
            text: 'N.º',
            dataIndex: 'MOVIMENTOS_NUMERO',
            align: 'right'
            
        },
        {
            flex: false,
            width: 47,
            text: 'Ser',
            dataIndex: 'MOVIMENTOS_SERIE',
            align: 'center'
            
        },
        {
            flex: false,
            width: 100,
            text: 'Data',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOS_EMISSAO',
            align: 'center'
        },
        {
            flex: false,
            width: 70,
            text: 'Cód',
            dataIndex: 'MOVIMENTOSITENS_ID_PRODUTOS',
            align: 'right'
        },
        {
            flex: 1,
            text: 'Produto',
            dataIndex: 'PRODUTOS_NOME',
            align: 'left'
            
        },
        {
            flex: false,
            width: 112,
            text: 'Preço',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOSITENS_PRECO',
            align: 'right',
            renderer: function(value, meta, record) {
                meta.style = "color: blue;";
                return Ext.util.Format.maskRenderer('#9.990,00', true, true)(value);
            }
        }
    ],

    footPanel: [
        {
            xtype: 'container',
            flex: 1
        },
        {
            xtype: 'container',
            width: 105
        }
    ]
});
