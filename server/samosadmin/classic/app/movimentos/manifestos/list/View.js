Ext.define('SamosAdmin.movimentos.manifestos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'manifestos',

    requires: [
        'SamosAdmin.movimentos.manifestos.form.View',
        'SamosAdmin.movimentos.manifestos.list.ViewController',
        'SamosAdmin.movimentos.manifestos.list.ViewModel'
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
                [1, 'Transporte'],
                [2, 'Número'],
                [3, 'Nome']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 150,
            defaultValue:3,
            store: [
                [0, 'Não Enviados'],
                [1, 'Enviados'],
                [2, 'Encerrados'],
                [3, 'Cancelados'],
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
            const status = record.get('MANIFESTOS_STATUS');
            if (status === 'E' || status == 'F') {
                return 'preto';
            } else if (status === 'N') {
                return 'verde';
            } else if (status === 'C') {
                return 'vermelho';
            }
        }
    },
    columns: {
        items: [
            {
                flex: false,
                width: 80,
                text: 'Empresa',
                dataIndex: 'MANIFESTOS_ID_EMPRESAS',
                align: 'center'
            },
            {
                flex: false,
                width: 70,
                text: 'N.º',
                dataIndex: 'MANIFESTOS_NUMERO',
                align: 'right'
                
            },
            {
                flex: false,
                width: 58,
                text: 'Série',
                dataIndex: 'MANIFESTOS_SERIE',
                align: 'center'
            },
            {
                flex: false,
                width: 149,
                text: 'Status',
                dataIndex: 'MANIFESTOS_STATUS',
                renderer: function(value, meta, record) {
                    if (value === 'E') {
                        return 'Enviado';
                    } else if (value === 'N') {
                        return 'Não Enviado';
                    } else if (value === 'R') {
                        return 'Encerrado';
                    } else if (value === 'C') {
                        return 'Cancelado';
                    }
                }
            },
            {
                flex: false,
                width: 93,
                text: 'Emissão',
                xtype: 'datecolumn',
                dataIndex: 'MANIFESTOS_EMISSAO',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome',
                dataIndex: 'MANIFESTOS_TRANSPNOME'
            },
            {
                flex: false,
                width: 150,
                xtype: 'cpfcnpjcolumn',
                text: 'CPF/CNPJ',
                dataIndex: 'MANIFESTOS_TRANSPCPFCNPJ'
            },
            {
                flex: false,
                width: 105,
                text: 'Valor',
                xtype: 'moneycolumn',
                dataIndex: 'MANIFESTOS_TOTAL',
                align: 'right'
            }
        ]
    }
});
