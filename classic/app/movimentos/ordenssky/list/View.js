Ext.define('SamosAdmin.movimentos.ordenssky.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ordenssky',

    requires: [
        'SamosAdmin.movimentos.ordenssky.form.View',
        'SamosAdmin.movimentos.ordenssky.list.ViewController',
        'SamosAdmin.movimentos.ordenssky.list.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.recebidas.View',
        'SamosAdmin.movimentos.ordenssky.list.sincronizaros.View',
        'SamosAdmin.movimentos.ordenssky.list.rotas.View',
        'SamosAdmin.movimentos.ordenssky.list.avanco.View'
    ],

    leftbuttons: [
        'Novo',
        {
            action: 'Recebidas',
            ui: 'primary-green'
        },
        {
            action: 'Sincronizar OS',
            ui: 'primary-blue'
        },
        'Rotas',
        {
            action: 'Avanço',
            ui: 'primary-blue'
        }
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('ORDENS_STATUS');
            const rota   = record.get('ORDENS_ID_ORDENSROTAS');

            let cls = '';
            
            if (status == '2' && rota) {//aberta e agendada
                cls = "azul";
            } else if (status == '7') {
                cls = "preto";
            } else if (status == '8') {
                cls = "lilas";
            } else if (status == '9' || status == '0') {
                cls = "vermelho";
            } else {
                cls = "verde";
            }

            return cls;
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
                        [0, 'Captura'],
                        [1, 'Pessoas'],
                        [2, 'Número']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 210,
                    store: [
                        ['1', 'Tratativa Manual'],
                        ['2', 'Aberta'],
                        ['3', 'Desconhecido'],
                        ['4', 'Aceita'],
                        ['5', 'Em deslocamento'],
                        ['6', 'Em execucao'],
                        ['7', 'Concluida com sucesso'],
                        ['8', 'Concluida sem sucesso'],
                        ['9', 'Cancelada'],
                        ['0', 'Realocada'],
                        ['T', 'Todas']
                    ]
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
                        width: 80,
                        text: 'Empresa',
                        dataIndex: 'ORDENS_ID_EMPRESAS',
                        align: 'center',
                        hidden: !configs.getMultiEmpresa()
                    },
                    {
                        flex: false,
                        width: 90,
                        text: 'N.º',
                        dataIndex: 'ORDENS_NUMERO',
                        align: 'right'
                        
                    },
                    {
                        flex: false,
                        width: 170,
                        text: 'Status',
                        dataIndex: 'ORDENS_STATUS',
                        renderer: function(value, meta, record) {
                            const statusConfig = [
                                ['1', 'Tratativa Manual'],
                                ['2', 'Aberta'],
                                ['3', 'Desconhecido'],
                                ['4', 'Aceita'],
                                ['5', 'Em deslocamento'],
                                ['6', 'Em execucao'],
                                ['7', 'Concluida com sucesso'],
                                ['8', 'Concluida sem sucesso'],
                                ['9', 'Cancelada'],
                                ['0', 'Realocada'],
                                ['T', 'Todas']
                            ];
                            
                            const selecionado  = statusConfig.find(status => status[0] == value) || [];

                            return selecionado[1];
                        }
                    },
                    {
                        flex: false,
                        width: 93,
                        text: 'Captura',
                        xtype: 'datecolumn',
                        dataIndex: 'ORDENS_EMISSAO',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 125,
                        text: 'Técnico',
                        dataIndex: 'USUARIOS_LOGIN'
                    },
                    {
                        flex: 1,
                        text: 'Nome',
                        dataIndex: 'ORDENS_NOME'
                    },
                    {
                        flex: false,
                        width: 180,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        flex: false,
                        width: 40,
                        text: 'Uf',
                        dataIndex: 'CIDADES_ESTADO'
                    }
                 ]
            }
        });

        this.callParent(arguments);
    }
});