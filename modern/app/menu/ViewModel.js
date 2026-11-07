Ext.define('SamosAdminModern.menu.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.menulist',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            listMenu: function(get) {
                return JSON.parse(get('menu'));
            }
        })
    }
});
