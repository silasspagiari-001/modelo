Ext.define('SamosAdminModern.dashboard.View', {
    extend: 'Ext.Window',
    xtype: 'dashboard',
    alias: 'dashboard',
    closable: true,
    maximized: true,
    title: 'Dashboard',

    requires: [
        'SamosAdminModern.dashboard.ViewController',
        'SamosAdminModern.dashboard.ViewModel'
    ],

    controller: 'dashboard',
    viewModel: 'dashboard',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    
    cls: 'my-custom-dialog',

    listeners: {
        close: function() {
            const viewQuery = Ext.$('menulist');
            const viewMenu = viewQuery[0] || null;
            if(viewQuery && viewMenu)
            {
                viewMenu.stopGauge();
            }
        }
    },

    //width: 200,

    initialize: function() {
        const tema = configs.getTema();

        this.callParent(arguments);
        
        this.setItems([
            {
                xtype: 'datefield',
                cls: 'my-custom-datefield',
                flex: 1,
                labelAlign: 'left',
                labelWidth: 40,
                flex: false,
                fieldLabel: 'Início',
                reference: 'inicio',
                bind: {
                    value: '{valueInicio}'
                },
                listeners: {
                    change: 'validarEventoECarregar'
                }
            },
            {
                xtype: 'datefield',
                cls: 'my-custom-datefield',
                flex: 1,
                flex: false,
                labelAlign: 'left',
                labelWidth: 40,
                fieldLabel: 'Final',
                reference: 'final',
                bind: {
                    value: '{valueFinal}'
                },
                listeners: {
                    change: 'validarEventoECarregar'
                }
            },
            {
                xtype: 'container',
                layout: 'hbox',
                flex: 1,
                items: [
                    {
                        xtype: 'container',
                        flex: 1,
                        html: '',
                        reference: 'grafico'
                    }
                    /*
                    {
                        xtype: 'cartesian',
                        reference: 'grafico',
                        flex: 1,
                        height: (window.innerHeight - 200),
                        shadow: true,
                        flipXY: true,
                        insetPadding: '10 10',
                        // Load the Named Data Store
                        store: {
                            autoLoad: false,
                            type: 'nodejsstore',
                            fields: ['EMPRESAS_ID', 'EMPRESAS_FANTASIA', 'EMPRESAS_FATURAMENTO'],
                            proxy: {
                                url: 'server/dashboard/faturamentoporempresa'
                            }
                        },
                     
                        axes: [
                            // X axis
                            {
                                type: 'numeric',
                                position: 'bottom',
                                fields: 'EMPRESAS_FATURAMENTO',
                                grid: false,
                                maximum: 200000,
                                title: 'Faturamento por Filial',
                                renderer: function (axis, label, layoutContext) {
                                    return Ext.util.Format.number(layoutContext.renderer(label) / 1000, '0,000');
                                }
                            },
                            // Y Axis
                            {
                                type: 'category',
                                position: 'left',
                                fields: 'EMPRESAS_FANTASIA',
                                grid: false
                            }
                        ],
                     
                        // Chart Type
                        series: [{
                            type: 'bar',
                            xField: 'EMPRESAS_FANTASIA',
                            yField: 'EMPRESAS_FATURAMENTO',
                            colors: [ '#D4CDAB' ],
                            subStyle: {
                                stroke: '#6CAEDE',
                                fill: '#6CAEDE'
                            },
                            label: {
                                field: 'EMPRESAS_FATURAMENTO',
                                display: 'outside',
                                orientation: 'horizontal',
                                renderer: function (value) {
                                    return 'R$: ' + Ext.util.Format.currency(value);
                                }
                            }
                        }],

                        sprites: [
                            {
                                type: 'text',
                                text: 'Total: R$ 0,00',
                                fontSize: 18,
                                fontWeight: 'bold',
                                width: 100,
                                height: 30,
                                x: ((innerWidth - 100) / 2) - 75,
                                y: (window.innerHeight - 200)
                            }
                        ]
                    }*/
                ]
            }
            /*
            {
                xtype: 'container',
                //cls: 'container-dashboard-cls',
                flex: 1,
                //padding: 1,
                margin: '0 5 5 5',
                layout: 'hbox',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                height: 200,
                items: [
                    {
                        xtype: 'container',
                        cls: 'subcontainer-dashboard-cls',
                        html: `
                            <div id='divGraficoDashboard' class='div-grafico'>

                            </div>
                        `
                    }
                ]
            }*/
        ])
    }
})