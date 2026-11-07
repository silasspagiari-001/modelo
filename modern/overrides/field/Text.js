Ext.define('Overrides.field.Text', {
    override:'Ext.field.Text',

    config: {
        clearable: false,
        searchedId: '',
        proximoFoco: null,
        searchedId: null
    },

    labelInPlaceHolder: false,
    labelAlign: 'top',
    upperCased: true,
 
    privates: {
        updateLabelInPlaceholder: function(){}
    },
    
    constructor: function() {
        this.callParent(arguments);
        
        if(this.ui == 'default'){
            this.setUI('textbold-' + configs.getTema());
        }

        if(this.upperCased) {
            this.on('change', function (txt, nv) {
                if (nv && nv.toUpperCase) {
                    txt.setValue(nv.toUpperCase());
                    txt.setInputValue(nv.toUpperCase());
                }
            });
        }
    }
});
