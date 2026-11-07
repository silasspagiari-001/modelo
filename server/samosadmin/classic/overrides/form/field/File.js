Ext.define('Overrides.form.field.File', {
    override: 'Ext.form.field.File',

    initComponent: function() {
        this.callParent(arguments);

        //seta o parametro accept do elemento também
        setTimeout(() => {
            this.fileInputEl.set({
                accept: this.accept
            });
        }, 100);
    }
});
