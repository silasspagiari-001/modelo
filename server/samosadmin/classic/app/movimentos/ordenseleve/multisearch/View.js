Ext.define('SamosAdmin.movimentos.ordenseleve.multisearch.View', {
    extend: 'SamosWidgets.multisearch.View',
    xtype: 'ordenselevemultisearch',

    requires: [
        'SamosAdmin.movimentos.ordenseleve.multisearch.ViewModel',
        'SamosAdmin.movimentos.ordenseleve.multisearch.ViewController'
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
            proximoFoco: 'inicio',
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
            reference: 'inicio',
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
                [3, 'Serviço'],                
                [1, 'Pessoas'],
                [2, 'Número'],

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
            width: 115,
            text: 'Valor OS',
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
                text: '{griordenssearch.selection.CIDADES_NOME}, {gridordenssearch.selection.CIDADES_ESTADO}'
            }
        },
        {
            xtype: 'label',
            width: 180,
            padding: '0 15 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridordenssearch.selection.PESSOAS_CELULAR}'
            }
        }
    ]
});
