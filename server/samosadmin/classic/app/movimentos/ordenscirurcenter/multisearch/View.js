Ext.define('SamosAdmin.movimentos.ordenscirurcenter.multisearch.View', {
    extend: 'SamosWidgets.multisearch.View',
    xtype: 'ordenscirurcentermultisearch',

    requires: [
        'SamosAdmin.movimentos.ordenscirurcenter.multisearch.ViewModel',
        'SamosAdmin.movimentos.ordenscirurcenter.multisearch.ViewController'
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
                [3, 'Referência']
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
            dataIndex: 'ORDENS_ID_EMPRESAS',
            align: 'center'
            
        },
        {
            flex: false,
            width: 68,
            text: 'Ref',
            dataIndex: 'ORDENS_REFERENCIA',
            align: 'right'
            
        },
        {
            flex: false,
            width: 68,
            text: 'N.º',
            dataIndex: 'ORDENS_NUMERO',
            align: 'right'
            
        },
        {
            flex: false,
            width: 58,
            text: 'Série',
            dataIndex: 'ORDENS_SERIE',
            align: 'center'
        },
        {
            flex: false,
            width: 93,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'ORDENS_EMISSAO',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Pessoa',
            dataIndex: 'ORDENS_NOME'
        },
        {
            flex: false,
            width: 145,
            xtype: 'cpfcnpjcolumn',
            text: 'CPF/CNPJ',
            dataIndex: 'ORDENS_CPFCNPJ'
        },
        {
            flex: false,
            width: 90,
            text: 'Valor',
            xtype: 'moneycolumn',
            dataIndex: 'ORDENS_TOTAL',
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
                text: '{gridmovimentossearch.selection.ORDENS_NOME}'
            }
        },
        {
            xtype: 'label',
            width: 200,
            padding: '0 0 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{griordenscirurcentersearch.selection.CIDADES_NOME}, {gridordenscirurcentersearch.selection.CIDADES_ESTADO}'
            }
        },
        {
            xtype: 'label',
            width: 180,
            padding: '0 15 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridordenscirurcentersearch.selection.PESSOAS_CELULAR}'
            }
        }
    ]
});
