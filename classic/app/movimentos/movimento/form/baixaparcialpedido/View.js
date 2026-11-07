Ext.define('SamosAdmin.movimentos.movimento.form.baixaparcialpedido.View', {
    extend: 'Ext.window.Window',
    xtype: 'formmovimentosbaixaparcialpedido',

    requires: [
        'SamosAdmin.movimentos.movimento.form.baixaparcialpedido.ViewModel',
        'SamosAdmin.movimentos.movimento.form.baixaparcialpedido.ViewController'
    ],

    mixins: [
        'SamosWidgets.container.Smart'
    ],

    width: 400,

    viewModel: 'formmovimentosbaixaparcialpedido',
    controller: 'formmovimentosbaixaparcialpedido',

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    constructor: function () {
        Ext.apply(this, {
            title: 'Baixas Parciais',
            formgroups: [
                {
                    xtype: 'container',
                    height: 180,
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'datefield',
                                    width: 140,
                                    reference: 'databaixa',
                                    fieldLabel: 'Pagamento',
                                    value: ( moment().format('YYYY-MM-DD') )
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    reference: 'valorbaixa',
                                    fieldLabel: 'Valor',
                                    fieldStyle: 'text-align:right;'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'textfield',
                                    width: 140,
                                    reference: 'infosaldorestante',
                                    fieldLabel: 'Saldo Restante',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;'
                                },
                                {
                                    xtype: 'datefield',
                                    flex: 1,
                                    reference: 'infoultimabaixa',
                                    fieldLabel: 'Última Baixa',
                                    readOnly: true,
                                    ui: 'field-readonly'
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
        this.addButtons();
        this.addFormGroups();
    }
});
