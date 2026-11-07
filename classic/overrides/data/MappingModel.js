Ext.define('Ext.model.MappingModel', {
    extend: 'Ext.data.NodeJSModel',

    proxy: {
        type: 'nodejsrest',
        
        writer: {
            type: 'json',
            nameProperty: 'mapping'
        }
    }
});
