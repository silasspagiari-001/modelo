Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.itens.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosmoveisagendamontagemitens',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.itens.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.itens.ViewController'
    ],

    modelName: 'Ext.data.Model',
    hidePaging: true,
    checkSelection: true, 

    rightbuttons: [
        'Gravar',        
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
            width: 110,
            text: 'Valor',
            xtype: 'moneycolumn',
            dataIndex: 'VALOR_LIQUIDO',
            align: 'right'
        },
        {
            flex: false,
            width: 110,
            text: 'Total',
            xtype: 'moneycolumn',
            dataIndex: 'TOTAL_LIQUIDO',
            align: 'right'
        },
        {
            flex: false,
            width: 50,
            text: 'Res',
            dataIndex: 'EMPRESAS_SIGLA',  
            align: 'center'
        },
        {
            flex: false,
            width: 50,
            text: 'Mon',
            dataIndex: 'MOVIMENTOSITENS_CSTPIS',
            align: 'center',            
            renderer: function(value, meta, record) {
                return value === 'ML' ? 'LJ' : '';
            }
        }
    ]
});
