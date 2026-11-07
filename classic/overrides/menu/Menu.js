Ext.define('Overrides.menu.Menu', {
    override: 'Ext.menu.Menu',
    
    constructor: function() {
        this.callParent(arguments);
        
        if(this.ui == 'default'){
            this.setUI('menu-clean-' + configs.getTema());
        }
    }
});
