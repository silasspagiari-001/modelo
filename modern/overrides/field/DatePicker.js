Ext.define('Overrides.field.DatePicker', {
    override:'Ext.field.DatePicker',

    constructor: function () {
        this.callParent(arguments);

        this.on({
            change: this.hideInvalidDate,
            blur  : this.hideInvalidDate
        });
    },

    //esconde a data 30/12/1899 (para o firebird)
    hideInvalidDate: function(txt) {
        if(moment(txt.getValue()).isSameOrBefore('1900-01-01')){
            txt.setValue(null);
        }
    }
});
