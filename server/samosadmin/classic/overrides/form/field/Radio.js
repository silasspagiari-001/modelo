Ext.define('Overrides.form.field.Radio', {
    override: 'Ext.form.field.Radio',

    initComponent: function () {
        this.callParent(arguments);

        //captura o click não só na caixa mas em todo o field
        //permite remover a seleção
        setTimeout(() => {
            this.getEl().dom.onclick = event => {
                if(!event.srcElement.className.match(/label/)) {
                    this.setValue(!this.value);
                }
            }
        }, 500);
    }
});
