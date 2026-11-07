Ext.define('SamosAdmin.consultas.graficoproduto.View', {
    extend: 'SamosModule.list.View',
    xtype: 'graficoproduto',

    requires: [
        'Ext.chart.CartesianChart',
        'Ext.chart.axis.Numeric3D',
        'Ext.chart.axis.Category3D',
        'Ext.chart.interactions.ItemEdit',
        'Ext.chart.series.Bar3D',
        'Ext.chart.legend.store.Store',
        'SamosAdmin.consultas.graficoproduto.ViewController',
        'SamosAdmin.consultas.graficoproduto.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    modelName: 'SamosAdmin.consultas.graficoproduto.Model',
    scrollable: true,

    toolbar: [
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Produto',
            tabela: 'produtos',
            complement: 'idproduto',
            reference: 'produto',
            proximoFoco: 'inicio',
            buscarPor: 'Genérica',
            callbackFn: 'onBuscarClick',
            associations: [
                ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                ['PRODUTOS_ID',   'PRODUTOS_ID']
            ],
            listeners: {
                focus: 'limparPesquisa'
            }
        },        
        {
            hidden: true,
            fieldLabel: 'IdProduto',
            itemId: 'idproduto'
        },
        {
            fieldLabel: 'Empresa',
            width: 215,
            forceSelection: true,
            editable: false,
            displayField: 'EMPRESAS_FANTASIA',
            valueField: 'EMPRESAS_ID',
            bind: {
                value: '{valueEmpresa}',
                store: '{empresas}'
            }
        },
        {
            fieldLabel: 'Ano',
            width: 60
        },
        {
            fieldLabel: 'Opções',
            width: 140,
            forceSelection: true,
            editable: false,
            displayField: 'EMPRESAS_FANTASIA',
            valueField: 'EMPRESAS_ID',
            bind: {
                value: '{anosAnteriores}'
            },
            xtype: 'checkbox',
            inputValue: 'T',
            uncheckedValue: 'F',
            boxLabel: 'Anos Anteriores',
            checked: false
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    constructor: function() {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            reference: 'formgraficos',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            }
                        }
                    ]
                }
            ]
        });


        this.callParent(arguments);
    }    
});
