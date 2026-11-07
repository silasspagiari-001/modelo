Ext.define('SamosAdmin.emissao.etiquetasprodutos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'emissaoetiquetas',

    modelName: 'SamosAdmin.emissao.Etiqueta',

    requires: [
        'SamosAdmin.emissao.etiquetasprodutos.form.View',
        'SamosAdmin.emissao.etiquetasprodutos.list.ViewController',
        'SamosAdmin.emissao.etiquetasprodutos.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Conteúdo',
            emptyText: '',
            flex: 3
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
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Layout'],
                [3, 'Código']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 150,
            store: [
                [0, 'Não Impressas'],
                [1, 'Imprimindo'],
                [2, 'Impressas'],
                [3, 'Todas']
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
                width: 90,
                text: 'Código',
                dataIndex: 'ETIQUETAS_ID',
                align: 'center'
            },
            {
                width: 130,
                text: 'Status',
                dataIndex: 'ETIQUETAS_STATUS',
                renderer: function(value, meta, record) {
                    if (value === 'F') {
                        return 'Não impressa';
                    } else if (value === 'I') {
                        return 'Imprimindo';
                    } else if (value === 'T') {
                        return 'Impressa';
                    }
                }
            },
            {
                width: 100,
                text: 'Emissão',
                xtype: 'datecolumn',
                dataIndex: 'ETIQUETAS_EMISSAO',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Descrição',
                dataIndex: 'ETIQUETAS_NOME'
            }
        ]
    }
});
