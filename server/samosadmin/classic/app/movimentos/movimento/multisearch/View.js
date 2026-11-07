Ext.define('SamosAdmin.movimentos.movimento.multisearch.View', {
    extend: 'SamosWidgets.multisearch.View',
    xtype: 'movimentosmultisearch',

    requires: [
        'SamosAdmin.movimentos.movimento.multisearch.ViewModel',
        'SamosAdmin.movimentos.movimento.multisearch.ViewController'
    ],

    hidePaging: true,

    rightbuttons: [
        'Importar',
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Numero',
            flex: 1
        },
        {
            flex: 3,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Pessoa',
            tabela: 'pessoas',
            complement: 'idpessoa',
            reference: 'pessoa',
            callbackFn: 'onBuscarClick',
            proximoFoco: 'datainicio',
            buscarPor: 'Genérica',
            associations: [
                ['PESSOAS_NOME', 'PESSOAS_NOME'],
                ['PESSOAS_ID',   'PESSOAS_ID']
            ]           
        },        
        {
            hidden: true,
            fieldLabel: 'IdPessoa',
            itemId: 'idpessoa'
        },
        {
            xtype: 'datefield',
            reference: 'datainicio',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Emissão'],
                [1, 'Pessoas'],
                [2, 'Número'],
                [3, 'Entrada/Saída']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    columns: [
        {
            flex: false,
            width: 80,
            text: 'Empresa',
            dataIndex: 'MOVIMENTOS_ID_EMPRESAS',
            align: 'center'
            
        },
        {
            flex: false,
            width: 68,
            text: 'N.º',
            dataIndex: 'MOVIMENTOS_NUMERO',
            align: 'right'
            
        },
        {
            flex: false,
            width: 58,
            text: 'Série',
            dataIndex: 'MOVIMENTOS_SERIE',
            align: 'center'
        },
        {
            flex: false,
            width: 93,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOS_EMISSAO',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Pessoa',
            dataIndex: 'MOVIMENTOS_NOME'
        },
        {
            flex: false,
            width: 145,
            xtype: 'cpfcnpjcolumn',
            text: 'CPF/CNPJ',
            dataIndex: 'MOVIMENTOS_CPFCNPJ'
        },
        {
            flex: false,
            width: 90,
            text: 'Valor',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOS_TOTAL',
            align: 'right'
        }
    ],

    footPanel: [
        {
            xtype: 'label',
            flex: 1,
            padding: '0 0 5 15',
            style : 'font-weight: bold; color: black;',
        },
        {
            xtype: 'label',
            width: 200,
            padding: '0 0 0 15',
            style : 'text-align: right; font-size: 15px; font-weight: bold; color: blue;',
            bind: {
                text: 'Total:'
            }
        },
        {
            xtype: 'label',
            width: 180,
            padding: '0 15 0 15',
            style : 'text-align: right; font-size: 15px; font-weight: bold; color: blue;',
            bind: {
                text: '{totalSelecionado}'
            }
        },
        {
            xtype: 'label',
            width: 36, //60
            padding: '0 0 5 15',
            style : 'font-weight: bold; color: black;',
        }
    ]
});
