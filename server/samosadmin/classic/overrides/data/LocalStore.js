Ext.define('Overrides.data.LocalStore', {
    override: 'Ext.data.LocalStore',

    indexOf: function(record) {
        var data = this.getData() || [];

        return data.indexOf(record);
    }
});
