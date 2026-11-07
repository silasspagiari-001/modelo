Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosmoveisagendamontagem',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.ViewController',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.itens.View',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.form.View'
    ],

    title: 'Agenda Montagem',
    modelName: 'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.Model',
    hidePaging: true,
    width: 850,
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Numero',
            flex: false,
            width: 70
        },        
        {
            flex: 1,
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
            width: 120
        },
        {
            xtype: 'datefield',
            reference: 'datafinal',            
            fieldLabel: 'Final',
            proximoFoco: 'turno',
            width: 120
        },
        {
            fieldLabel: 'Turno',
            reference: 'turno',
            proximoFoco: 'situacao',
            width: 95,
            store: [
                ['M', 'Manhã'],
                ['T', 'Tarde'],
                ['N', 'Noite'],
                [0,   'Todos']

            ]
        },
        {
            fieldLabel: 'Situação',
            reference: 'situacao',
            width: 140,
            store: [
                [2, 'Não Entregue'],
                [0, 'Montar'],
                [3, 'Pendente'],
                [1, 'Montado'],
                [4, 'Todos']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    
    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const situacao = record.get('MOVIMENTOS_SITUACAO');

            if (situacao == 0) {
                return "verde";
            } else if (situacao == 1) {
                return "azul";
            } {
                return "preto";
            }
        }
    },

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
            flex: 1,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOS_EMISSAO',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Agendamento',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOSITENS_DATAMONTAGEM',
            align: 'center'
        },
        {
            flex: false,
            width: 72,
            text: 'Turno',
            dataIndex: 'MOVIMENTOSITENS_HORAMONTAGEM',
            renderer: function(value, meta, record) {
                return value === 'M' ? 'Manhã' :
                       value === 'T' ? 'Tarde' :
                       value === 'N' ? 'Noite' : '';
            }
        },
        {
            flex: false,
            width: 110,
            text: 'Situação',
            dataIndex: 'MOVIMENTOS_SITUACAO',
            renderer: function(value, meta, record) {
                return value == 0 ? 'Montar'  : 
                       value == 3 ? 'Pendente' :
                       value == 1 ? 'Em Romaneio' : 
                                    'Montado';
            }
        },
        {
            flex: false,
            width: 95,
            text: 'Total',
            xtype: 'moneycolumn',
            dataIndex: 'MOVIMENTOS_TOTAL',
            align: 'right'
        },
        {
            xtype: 'actioncolumn',
            width: 60,
            text: 'Itens',
            align: 'center',
            items: [{
                iconCls: 'x-fa fa-list',
                handler: function(grid, rowIndex, colIndex) {
                    var record = grid.getStore().getAt(rowIndex);
                    const janelaItens = Ext.create({
                        xtype: 'romaneiosmoveisagendamontagemitens',
                        title: 'Itens Pedido ' + record.get('MOVIMENTOS_NUMERO') + ' da empresa ' + record.get('MOVIMENTOS_ID_EMPRESAS')
                    });
            
                    janelaItens.getViewModel().set({
                        model: record
                    });
                }
            }]
        }
    ],

    footPanel: [
        {
            xtype: 'label',
            flex: 1,
            padding: '0 0 5 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridromaneiosmoveisagendamontagem.selection.MOVIMENTOS_NOME}'
            }
        },
        {
            xtype: 'label',
            width: 200,
            padding: '0 0 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridromaneiosmoveisagendamontagem.selection.CIDADES_NOME}, {gridromaneiosmoveisagendamontagem.selection.CIDADES_ESTADO}'
            }
        },
        {
            xtype: 'label',
            width: 180,
            padding: '0 15 0 15',
            style : 'font-weight: bold; color: black;',
            bind: {
                text: '{gridromaneiosmoveisagendamontagem.selection.PESSOAS_CELULAR}'
            }
        }
    ]
});
