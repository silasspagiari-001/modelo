Ext.define('Overrides.form.Basic', {
    override:'Ext.form.Basic',
    
    setValues: function(values) {
        var me = this,
            v, vLen, val;
 
        function setVal(fieldId, val) {
            var field = me.findField(fieldId);
            if (field) {
                if(field.xtype == 'numberfield') {
                    var incomplete = val && (
                                        val.toString().slice(-1) == '.'   ||
                                        val.toString().slice(-2) == '.0'  ||
                                        val.toString().slice(-3) == '.00'
                                    );

                    if(!incomplete) { 
                        field.setValue(val);
                        if (me.trackResetOnLoad) {
                            field.resetOriginalValue();
                        }
                    }
                } else {
                    field.setValue(val);
                    if (me.trackResetOnLoad) {
                        field.resetOriginalValue();
                    }
                }
            }
        }
 
        // Suspend here because setting the value on a field could trigger 
        // a layout, for example if an error gets set, or it's a display field 
        Ext.suspendLayouts();
        if (Ext.isArray(values)) {
            // array of objects 
            vLen = values.length;
 
            for (v = 0; v < vLen; v++) {
                val = values[v];
 
                setVal(val.id, val.value);
            }
        } else {
            // object hash 
            Ext.iterate(values, setVal);
        }
        Ext.resumeLayouts(true);
        return this;
    }
});