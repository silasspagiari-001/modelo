Ext.define('Overrides.form.field.Tag', {
    override:'Ext.form.field.Tag',

    getValue: function() {
        var me = this,
            store = me.getStore(),
            picker = me.picker,
            rawValue = me.getRawValue(),
            value = me.value;

            if (!store.isEmptyStore && me.getDisplayValue() !== rawValue) {
            me.displayTplData = undefined;
            if (picker) {
                me.valueCollection.suspendEvents();
                picker.getSelectionModel().deselectAll();
                me.valueCollection.resumeEvents();
                me.lastSelection = null;
            }
            if (store.isLoaded() && (me.multiSelect || me.forceSelection)) {
                value = me.value = undefined;
            } else {
                value = me.value = rawValue;
            }
        }
 
        me.value = value == null ? null : value;
        return me.value;
    }
});
