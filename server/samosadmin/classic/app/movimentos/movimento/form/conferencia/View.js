Ext.define('SamosAdmin.movimentos.movimento.form.conferencia.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosconferencia',

    requires: [
        'SamosAdmin.movimentos.movimento.form.conferencia.ViewModel',
        'SamosAdmin.movimentos.movimento.form.conferencia.ViewController'
    ],

    title: 'Conferência de Produtos',
    width: 900,

    modelName: 'SamosAdmin.movimentos.movimento.ModelItens',
    hidePaging: true,

    rightbuttons: [
        'Liberar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Barras',
                    flex: 1
                },
                {
                    fieldLabel: 'Qtde',
                    width: 100
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],

            viewConfig: {
                getRowClass: function(record, rowIndex, store) {
                    if(record.get('ITENS_QUANTIDADERESTANTE') == 0) {
                        return 'verde';
                    } else {
                        return 'preto';
                    }
                }
            },
        
            columns: [
                {
                    width: 80,
                    text: 'Código',
                    dataIndex: 'MOVIMENTOSITENS_ID_PRODUTOS',
                    align: 'center',
                    renderer: function(value, meta, record) {
                        if (record.get('PRODUTOS_STATUS') == 'L') {
                            return '(*) ' + value;
                        } else {
                            return value;
                        }
                    }
                },
                {
                    flex: 1,
                    text: 'Nome',
                    dataIndex: 'PRODUTOS_NOME'
                },
                {
                    width: 65,
                    text: 'UN',
                    align: 'right',
                    dataIndex: 'PRODUTOS_UNIDADE'
                },
                {
                    width: 85,
                    text: 'Qtde',
                    align: 'right',
                    dataIndex: 'MOVIMENTOSITENS_QUANTIDADE'
                },
                {
                    width: 105,
                    text: 'Restante',
                    align: 'right',
                    dataIndex: 'ITENS_QUANTIDADERESTANTE'
                }
            ]
        });
        
        this.callParent(arguments);        
    }
});
