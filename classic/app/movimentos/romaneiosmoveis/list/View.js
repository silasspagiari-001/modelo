Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'romaneiosmoveis',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.form.View',
        'SamosAdmin.movimentos.romaneiosmoveis.list.ViewController',
        'SamosAdmin.movimentos.romaneiosmoveis.list.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.View' ,
        'SamosAdmin.movimentos.romaneiosmoveis.list.baixa.View' 
    ],

    leftbuttons: [
        'Novo',
        'Agendamento',
        'Baixa por Lote'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function(config){
        const isEntrega = config.title.match(/Entrega/);
        const romStilo = configs.getClientName() == 'stilomoveis';

        Ext.apply(this, {
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
                    proximoFoco: 'inicio',
                    callbackFn: 'onBuscarClick',
                    buscarPor: 'Genérica',
                    valueTipo: isEntrega ? 'D' : 'C',
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
                    fieldLabel: 'Status',
                    width: 150,
                    defaultValue:3,
                    store: isEntrega ? [ [0, 'Entregar'],
                                         [1, 'Executados'],
                                         [2, 'Faturados'],
                                         [3, 'Todos']
                                       ] : [
                                         [0, 'Montar'],
                                         [1, 'Executados'],
                                         [2, 'Faturados'],
                                         [3, 'Todos']
                                       ]                    
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],

            viewConfig: {
                getRowClass: function(record, rowIndex, store) {
                    const status = record.get('ROMANEIOS_STATUS');

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
                        width: 100,
                        text: 'Número',
                        dataIndex: 'ROMANEIOS_NUMERO',
                        align: 'right'
                        
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Série',
                        dataIndex: 'ROMANEIOS_SERIE',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Emissão',
                        xtype: 'datecolumn',
                        dataIndex: 'ROMANEIOS_EMISSAO',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 115,
                        text: 'Status',
                        dataIndex: 'ROMANEIOS_STATUS',
                        renderer: function(value, meta, record) {
                            return value == 'N' ? (isEntrega  ? 'Entregar' : 'Montar') : 
                                   value == 'E' ? 'Executado' : 
                                   value == 'R' ? 'Retirado'  :
                                   value == 'F' ? 'Faturado'  : ''
                        }
                    },
                    {
                        flex: 1,
                        text: 'Nome',
                        dataIndex: (romStilo ? 'PEDIDOS_NOME' : 'PESSOAS_NOME')
                    },
                    {
                        flex: false,
                        width: 150,
                        xtype: 'cpfcnpjcolumn',
                        text: 'CPF/CNPJ',
                        dataIndex: (romStilo ? 'PEDIDOS_CPFCNPJ' : 'PESSOAS_CPFCNPJ')
                    },
                    {
                        flex: false,
                        width: 130,
                        text: 'Valor',
                        xtype: 'moneycolumn',
                        dataIndex: 'ROMANEIOS_TOTAL',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 130,
                        text: (isEntrega ? 'Serviços' : 'Montagem'),
                        xtype: 'moneycolumn',
                        dataIndex: 'ROMANEIOS_FRETE',
                        align: 'right'
                    }
                ]
            }
        });

        this.callParent(arguments);
    }
});
