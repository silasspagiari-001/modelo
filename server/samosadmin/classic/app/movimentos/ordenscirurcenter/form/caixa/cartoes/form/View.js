Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.cartoes.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formordenscirurcentercaixaformcartoes',

    requires: [
        'SamosAdmin.movimentos.ordenscirurcenter.form.caixa.cartoes.form.ViewModel',
        'SamosAdmin.movimentos.ordenscirurcenter.form.caixa.cartoes.form.ViewController'
    ],

    title: 'Detalhes do Cartão',
    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    width: 400,
    height: 305,

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    height: 210,
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Número do Cartão',
                                    reference: 'numero',
                                    proximoFoco: 'observacoes',
                                    maxLength: 16,
                                    bind: {
                                        value: '{model.CARTOES_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Observações',
                                    reference: 'observacoes',
                                    maxLength: 50,
                                    proximoFoco: 'save',
                                    bind: {
                                        value: '{model.CARTOES_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'textarea',
                                    anchor: '100%',
                                    grow  : true,
                                    width : '100%',
                                    height: 125
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
