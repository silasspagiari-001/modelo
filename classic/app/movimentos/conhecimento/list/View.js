Ext.define('SamosAdmin.movimentos.conhecimento.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'conhecimento',

    requires: [
        'SamosAdmin.movimentos.conhecimento.form.View',
        'SamosAdmin.movimentos.conhecimento.list.ViewController',
        'SamosAdmin.movimentos.conhecimento.list.ViewModel'
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
            fieldLabel: 'Remetente',
            tabela: 'pessoas',
            complement: 'idpessoas',
            reference: 'pessoas',
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
            itemId: 'idpessoas'
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
                [1, 'Pessoa'],
                [2, 'Número'],
                [3, 'Nome']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 150,
            defaultValue:3,
            store: [
                [0, 'Não Faturado'],
                [1, 'Faturado'],
                [2, 'Todos']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('CONHECIMENTOS_STATUS');

            if (status == 'E') {
                return "preto";
            } else if (status == 'C') {
                return "vermelho";                
            } else {
                return "verde";
            }
        }
    },
    columns: {
        items: [
            {
                flex: false,
                width: 80,
                text: 'Empresa',
                dataIndex: 'CONHECIMENTOS_ID_EMPRESAS',
                align: 'center'
            },
            {
                flex: false,
                width: 70,
                text: 'N.º',
                dataIndex: 'CONHECIMENTOS_NUMERO',
                align: 'right'
                
            },
            {
                flex: false,
                width: 58,
                text: 'Série',
                dataIndex: 'CONHECIMENTOS_SERIE',
                align: 'center'
            },
            {
                flex: false,
                width: 149,
                text: 'Status',
                dataIndex: 'CONHECIMENTOS_STATUS',
                renderer: function(value, meta, record) {
                    if (value === 'E') {
                        return 'Enviado';
                    } else if (value === 'N') {
                        return 'Não Enviado';
                    } else if (value === 'C') {
                        return 'Cancelado'
                    }
                }
            },
            {
                flex: false,
                width: 93,
                text: 'Emissão',
                xtype: 'datecolumn',
                dataIndex: 'CONHECIMENTOS_EMISSAO',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Rementente',
                dataIndex: 'PESSOAS_NOME'
            },
            {
                flex: false,
                width: 105,
                text: 'Valor',
                xtype: 'moneycolumn',
                dataIndex: 'CONHECIMENTOS_SERVICOS',
                align: 'right'
            }
        ]
    }
});
