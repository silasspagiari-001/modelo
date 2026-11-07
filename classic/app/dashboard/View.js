Ext.define('SamosAdmin.dashboard.View', {
    extend: 'SamosWidgets.container.Smart',
    xtype: 'samosdashboard',

    requires: [
        'Ext.chart.theme.Muted',
        'Ext.chart.grid.HorizontalGrid3D',
        'Ext.chart.grid.VerticalGrid3D',
        'Ext.chart.series.Cartesian',
        'Ext.ux.layout.ResponsiveColumn'
    ],

    title: 'Dashboard',

    controller: 'samosdashboard',
    viewModel: 'samosdashboard',
    mainView: true,

    scrollable: 'vertical',
    layout: 'responsivecolumn',

    items: [
        {
            xtype: 'panel',
            reference: 'panelfaturamento',
            userCls: 'big-100',
            title: 'Faturamento por Filial',
            cls: 'shadow',
            bodyPadding: 5,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            tools: [
                {
                    xtype: 'datefield',
                    width: 175,
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
                    width: 175,
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
                    type: 'refresh',
                    toggleValue: false,
                    listeners: {
                        click: 'loadData'
                    }
                }
            ],
            items: {
                xtype: 'cartesian',
                height: 250,
                reference: 'chart',
                bind: {
                    store: '{faturamento}'
                },
                insetPadding: 20,
                animation: {
                    easing: 'backOut',
                    duration: 400
                },
                axes: [
                    {
                        type: 'numeric3d',
                        position: 'left',
                        fields: 'EMPRESAS_FATURAMENTO',
                        label: {
                            textAlign: 'right'
                        },
                        renderer: 'onAxisLabelRender',
                        grid: {
                            odd: {
                                fillStyle: 'rgba(255, 255, 255, 0.06)'
                            },
                            even: {
                                fillStyle: 'rgba(0, 0, 0, 0.03)'
                            }
                        }
                    }, 
                    {
                        type: 'category3d',
                        position: 'bottom',
                        fields: 'EMPRESAS_FANTASIA',
                        renderer: 'onAxisCategoryRender',
                        grid: true
                    }
                ],
                series: [
                    {
                        type: 'bar3d',
                        xField: 'EMPRESAS_FANTASIA',
                        yField: 'EMPRESAS_FATURAMENTO',
                        renderer: 'onColumnRender',
                        style: {
                            minGapWidth: 20
                        },
                        highlightCfg: {
                            saturationFactor: 1.5
                        },
                        label: {
                            field: 'EMPRESAS_FATURAMENTO',
                            display: 'insideEnd',
                            renderer: 'onSeriesLabelRender'
                        },
                        tooltip: {
                            trackMouse: true,
                            renderer: 'onTooltipRender'
                        }
                    }
                ],
                sprites: [
                    {
                        type: 'text',
                        text: 'Total: R$ 0,00',
                        fontSize: 18,
                        fontWeight: 'bold',
                        width: 100,
                        height: 30,
                        x: ((innerWidth - 250) / 2) - 75,
                        y: 250
                    }
                ]
            }
        }
    ]
});
