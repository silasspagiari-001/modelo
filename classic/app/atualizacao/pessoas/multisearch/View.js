Ext.define('SamosAdmin.atualizacao.pessoas.multisearch.View', {
    extend: 'SamosWidgets.multisearch.View',
    xtype: 'pessoasmultisearch',

    requires: [
        'SamosAdmin.atualizacao.pessoas.multisearch.ViewModel',
        'SamosAdmin.atualizacao.pessoas.multisearch.ViewController'
    ],

    title: 'Pessoas',
    hidePaging: true,

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    constructor: function(){
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    flex: 3
                },
                {
                    fieldLabel: 'Ordem',
                    width: 125,
                    store: [
                        [0, 'Nome'],
                        [1, 'Contéudo'],
                        [9, 'Fantasia'],                        
                        [6, 'Genérica'],                        
                        [2, 'Endereço'],
                        [3, 'Email'],
                        [4, 'CPF/CNPJ'],
                        [7, 'Cidade'],
                        [8, 'Telefone'],
                        [5, 'Código']
                    ]
                },
                {
                    fieldLabel: 'Tipo',                     
                    width: 172,
                    store: configs.getPessoas().tipos.concat([['0', 'Todos']])
                },        
                {
                    fieldLabel: 'Status',
                    width: 110,
                    store: [
                        [0, 'Ativos'],
                        [1, 'Inativos'],
                        [2, 'Todos']
                    ]
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ]
        });

        this.callParent(arguments);
    },

    columns: [
        {
            width: 100,
            text: 'Código',
            dataIndex: 'PESSOAS_ID',
            align: 'right',
            renderer: function(value, meta, record) {
                if ((record.get('PESSOAS_PROPRIEDADES') || '').length > 0) {
                    return '(P) ' + value;
                } else {
                    return value;
                }
            }
        },
        {
            flex: 1,
            text: 'Nome',
            dataIndex: 'PESSOAS_NOME'
        },
        {
            width: 150,
            text: 'CPF/CNPJ',
            xtype: 'cpfcnpjcolumn',
            dataIndex: 'PESSOAS_CPFCNPJ'
        },
        {
            flex: false,
            width: 100,
            text: 'Crédito',
            xtype: 'moneycolumn',
            dataIndex: 'PESSOAS_CREDITO',
            align: 'right',
            renderer: function(value, meta, record, rowIndex, colIndex, store, view) {
                return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
            }
        }
    ],

    footPanel: [
        {
            xtype: 'container',
            flex: 1
        },
        {
            xtype: 'label',
            flex: 1.2,
            padding: '5 0 5 15',
            style : 'text-align:right; font-weight: bold; color: blue;',
            bind: {
                text: 'Selecionados: {totalSelecionados}'
            }
        },
        {
            xtype: 'label',
            flex: 1.2,
            padding: '5 0 5 15',
            style : 'text-align:right; font-weight: bold; color: blue;',
            bind: {
                text: 'Total Crédito: {totalCredito}'
            }
        },
        {
            xtype: 'container',
            width: 54
        }
    ]
});
