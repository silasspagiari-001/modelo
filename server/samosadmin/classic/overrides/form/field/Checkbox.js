Ext.define('Overrides.form.field.Checkbox', {
    override: 'Ext.form.field.Checkbox',

    uncheckedValue: 'F',
    inputValue: 'T',
    labelAlign: 'top',

    ui: 'checkbold',

    constructor: function () {
        this.callParent(arguments);

        //captura o click não só na caixa mas em todo o field
        setTimeout(() => {
            if(this.getEl()) {
                this.getEl().dom.onclick = event => {
                    if(!event.srcElement.className.match(/label/) && !this.readOnly) {
                        this.setValue(!this.value);
                    }
                }
            }
        }, 500);
    }
});
