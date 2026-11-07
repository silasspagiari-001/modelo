Ext.define('SamosAdmin.movimentos.notaconsumidor.form.debitospessoa.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formnotaconsumidordebitospessoa', 

    requires: [
        'SamosAdmin.movimentos.notaconsumidor.form.debitospessoa.ViewModel',
        'SamosAdmin.movimentos.notaconsumidor.form.debitospessoa.ViewController'
    ],

    modelName: 'SamosFinanceiros.titulos.Model',

    title: 'Débitos Cliente',
    width: 690,
    height: 459,
    flexForm: 0.6,

    leftbuttons: [
        'Liberar'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true, 

    columns: [
        {
            width: 82,
            text: 'Empresa',
            dataIndex: 'FINANCEIROS_ID_EMPRESAS',
            align: 'center'
        },
        {
            width: 67,
            text: 'N.º',
            dataIndex: 'FINANCEIROS_NUMERO',
            align: 'right'
            
        },
        {
            width: 47,
            text: 'Ser',
            dataIndex: 'FINANCEIROS_SERIE',
            align: 'center'
            
        },
        {
            width: 47,
            text: 'Par',
            dataIndex: 'FINANCEIROS_PARCELA',
            align: 'center'
        },
        {
            width: 100,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'FINANCEIROS_EMISSAO',
            align: 'center'
        },
        {
            width: 105,
            text: 'Vencimento',
            xtype: 'datecolumn',
            dataIndex: 'FINANCEIROS_VENCIMENTO',
            align: 'center',
            renderer: function(value, meta, record) {
                if (momentTz(value).isSameOrBefore(momentServer())) {
                    if(record.get('FINANCEIROS_STATUS') !== 'P') {
                        meta.style = "color: green;";
                    }
                } else {
                    meta.style = "color: blue;";
                }
                
                if(value && momentTz(value).isSameOrBefore('1900-01-01')) {
                    return '';
                } else {
                    return momentTz(value).format('DD/MM/YYYY');
                }
            }
        },
        {
            width: 112,
            text: 'Em Aberto',
            xtype: 'moneycolumn',
            dataIndex: 'FINANCEIROS_ABERTO',
            align: 'right',
            renderer: function(value, meta, record) {
                meta.style = "color: red;";
                return Ext.util.Format.maskRenderer('#9.990,00', true, true)(value);
            }
        },
        {
            width: 80,
            text: 'Prazo',
            dataIndex: 'PRAZOCALCULADO_FINANCEIRO',
            align: 'right'
        }
    ],

    formgroups: [
        {
            items: [
                {
                    items: [
                        {
                            height: 80,
                            xtype: 'textarea',
                            reference: 'observacoes',
                            fieldLabel: 'Observações',
                            proximoFoco: 'credito',
                            margin: '5 5 20 5',
                            maxLength: 2048,
                            readOnly: true,
                            bind: {
                                value: '{observacoes}',
                            },
                            anchor: '90%',
                            width : '90%'
                        }
                    ]
                }
            ]
        }
    ],

    footPanel: [
        {
            xtype: 'container',
            flex: 1
        },
        {
            xtype: 'label',
            width: 112,
            padding: '0 0 0 15',
            style : 'font-weight: bold; color: red; text-align: right',
            bind: {
                text: '{totalFormatado}'
            }
        },
        {
            xtype: 'container',
            width: 105
        }
    ]
});
