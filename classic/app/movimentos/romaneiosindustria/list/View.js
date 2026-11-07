Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'romaneiosindustria',

    requires: [
        'SamosAdmin.movimentos.romaneiosindustria.list.ViewController',
        'SamosAdmin.movimentos.romaneiosindustria.list.ViewModel'
    ],

    rightbuttons: [
        'Imprimir',
        'Sair'
    ],

    hidePaging: true,
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,

    gridListeners: {
        selectionchange: 'onSelectionChange'
    },

    toolbar: [
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Usuário',
            tabela: 'usuarios',
            complement: 'idusuario',
            reference: 'usuario',
            proximoFoco: 'pessoa',
            buscarPor: 'Genérica',
            associations: [
                ['USUARIOS_NOME', 'USUARIOS_NOME'],
                ['USUARIOS_ID',   'USUARIOS_ID']
            ]           
        },      
        {
            hidden: true,
            fieldLabel: 'IdUsuario',
            itemId: 'idusuario'
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Pessoa',
            tabela: 'pessoas',
            complement: 'idpessoa',
            reference: 'pessoa',
            proximoFoco: 'inicio',
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
                [2, 'Número']

            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('MOVIMENTOS_STATUS');

            if (status == 'N') {
                return "verde";
            } else if (status == 'E') {
                return "azul";
            } else if (status == 'R') {
                return "lilas";
            } else if (status == 'F') {
                return "preto";
            }
        }
    },

    columns: {
        items: [
            {
                flex: false,
                width: 80,
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
                width: 100,
                text: 'Emissão',
                xtype: 'datecolumn',
                dataIndex: 'MOVIMENTOS_EMISSAO',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome',
                dataIndex: 'PESSOAS_NOME'
            },
            {
                flex: 0.5,
                text: 'Cidade',
                dataIndex: 'CIDADES_NOME'
            },
            {
                flex: false,
                width: 50,
                text: 'UF',
                dataIndex: 'CIDADES_ESTADO'
            },
            {
                flex: false,
                width: 105,
                text: 'Valor',
                xtype: 'moneycolumn',
                dataIndex: 'MOVIMENTOS_TOTAL',
                align: 'right'
            }
        ]
    },
    
    footPanel: [
        {
            xtype: 'container',
            flex: 1
        },
        {
            xtype: 'label',
            width: 160,
            padding: '5 21 5 15',
            style : 'font-weight:bold;text-align:right;color:black;',
            bind: {
                html: 'Selecionado ({movimentosSelecionados})<br>Total'
            }
        },
        {
            xtype: 'label',
            width: 110,
            padding: '5 23 5 15',
            style : 'font-weight:bold;text-align:right;color:blue;',
            bind: {
                  html: '{totalSelecionado}<br>{totalGeral}'
            }
        }
    ]    
});
