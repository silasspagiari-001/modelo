Ext.define('SamosAdmin.movimentos.encomendas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'encomendas',

    modelName: 'SamosAdmin.movimentos.encomendas.Model',

    requires: [
        'SamosAdmin.movimentos.encomendas.form.View',
        'SamosAdmin.movimentos.encomendas.list.ViewController',
        'SamosAdmin.movimentos.encomendas.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
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
            store: [
                [0, 'Não Faturado'],
                [1, 'Faturado'],
                [2, 'Todas']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status   = record.get('MOVIMENTOS_STATUS');
            
            if (status == 'F') {
                return "preto";
            } else if (status == 'N') {
                return "verde";
            }
        }
    },

    constructor: function(){
        Ext.apply(this, {
            columns: {
                items: [
                    {
                        flex: false,
                        width: 80,
                        text: 'Empresa',
                        dataIndex: 'MOVIMENTOS_ID_EMPRESAS',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 70,
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
                        width: 149,
                        text: 'Status',
                        dataIndex: 'MOVIMENTOS_STATUS',
                        renderer: function(value, meta, record) {
                            if (value === 'F') {
                                return 'Faturado';
                            } else if (value === 'N') {
                                return 'Não Faturado';
                            }
                        }
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
                        flex: false,
                        width: 130,
                        text: 'Vendedor',
                        dataIndex: 'USUARIOS_LOGIN'
                    },
                    {
                        flex: 1,
                        text: 'Nome',
                        dataIndex: 'MOVIMENTOS_NOME'
                    },
                    {
                        flex: false,
                        width: 150,
                        xtype: 'cpfcnpjcolumn',
                        text: 'CPF/CNPJ',
                        dataIndex: 'MOVIMENTOS_CPFCNPJ'
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
            }
        });

        this.callParent(arguments);
    }
});
