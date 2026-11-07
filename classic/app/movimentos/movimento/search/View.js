Ext.define('SamosAdmin.movimentos.movimento.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'movimentossearch',

    requires: [
        'SamosAdmin.movimentos.movimento.search.ViewModel',
        'SamosAdmin.movimentos.movimento.search.ViewController'
    ],

    title: 'Pedidos',

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Numero',
            flex: false,
            width: 70         
        },
        {
            flex: 3,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Pessoa',
            tabela: 'pessoas',
            complement: 'idpessoa',
            reference: 'pessoa',
            proximoFoco: 'datainicio',
            callbackFn: 'onBuscarClick',
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
            proximoFoco: 'datafinal',
            width: 130
        },
        {
            xtype: 'datefield',
            reference: 'datafinal',            
            fieldLabel: 'Final',
            proximoFoco: 'ordempesquisa',
            width: 130
        },
        {
            fieldLabel: 'Ordem',
            reference: 'ordempesquisa',
            width: 115,
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
            bind: {
                text: '{gridmovimentossearch.selection.MOVIMENTOS_NOME}'
            }
        },
        {
            xtype: 'label',
            width: 200,
            padding: '0 0 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridmovimentossearch.selection.CIDADES_NOME}, {gridmovimentossearch.selection.CIDADES_ESTADO}'
            }
        },
        {
            xtype: 'label',
            width: 180,
            padding: '0 15 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridmovimentossearch.selection.MOVIMENTOS_CELULAR}'
            }
        }
    ]
});
