Ext.define('SamosAdmin.movimentos.ordenseleve.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ordenseleve',

    requires: [
        'SamosAdmin.movimentos.ordenseleve.form.View',
        'SamosAdmin.movimentos.ordenseleve.list.ViewController',
        'SamosAdmin.movimentos.ordenseleve.list.ViewModel',
    ],

    leftbuttons: [
        'Novo',
        'Exportar'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status   = record.get('ORDENS_STATUS');

            if (status == 'N') {
                return "verde";
            } else if (status == 'E') {
                return "azul";
            } else if (status == 'F') {
                return "preto";
            }

        }
    },

    constructor: function(){
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Numero',
                    width: 95
                },
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Pessoa',
                    tabela: 'pessoas',
                    complement: 'idpessoa',
                    reference: 'pessoa',
                    proximoFoco: 'inicio',
                    ignoreNotFound: true,
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
                    width: 122
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    width: 122
                },
                {
                    fieldLabel: 'Ordem',
                    width: 105,
                    store: [
                        [0, 'Emissão'],
                        [3, 'Serviço'],
                        [1, 'Pessoas'],
                        [2, 'Número']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 210,
                    store: configs.getOrdens().status
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],

            columns: {
                items: [
                    {
                        flex: false,
                        width: 90,
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
                        width: 100,  //149
                        text: 'Status',
                        dataIndex: 'ORDENS_STATUS',
                        renderer: function(value, meta, record) {
                            if (value === 'N') {
                                return 'Executar';
                            } else if (value === 'E') {
                                return 'Executado';
                            } else if (value === 'F') {
                                return 'Faturado';
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Dt Serviço',
                        dataIndex: 'ORDENS_REABERTURA',
                        renderer: function(value, meta, record) {
                            return moment(value).format('DD/MM/YYYY');
                        }
                    },
                    {
                        flex: 1,
                        text: 'Equipamento',
                        dataIndex: 'SERVICOS_NOME'
                    },
                    {
                        flex: 1,
                        text: 'Pessoa',
                        dataIndex: 'ORDENS_NOME'
                    },
                    {
                        flex: 1,
                        text: 'Nome Fantasia',
                        dataIndex: 'PESSOAS_FANTASIA'
                    },
                    {
                        flex: false,
                        width: 105,
                        text: 'Valor',
                        xtype: 'moneycolumn',
                        dataIndex: 'ORDENS_TOTAL',
                        align: 'right'
                    }
                 ]
            }
        });

        this.callParent(arguments);
    }
});